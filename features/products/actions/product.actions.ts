'use server'

import { getBrands } from '@/features/brands/queries/brand.queries'
import { getCategories } from '@/features/categories/queries/category.queries'
import { PRODUCT_DETAIL_SELECT, getProducts } from '@/features/products/queries/product.queries'
import { db } from '@/shared/lib/db'
import { importProductRowSchema, productDbBaseSchema, productDbSchema } from '@/features/products/schemas/product.schema'
import { requireAdmin } from '@/shared/lib/require-admin'
import type { ActionResult } from '@/shared/types/action-result.types'
import type { DrawerProduct } from '@/shared/types/entity-products.types'
import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function invalidateProductCaches() {
  revalidatePath('/admin/products')
  revalidatePath('/admin/inventory')
  revalidatePath('/admin/dashboard')
  revalidatePath('/catalogo')
  revalidatePath('/')
  revalidateTag('products', 'max')
  revalidateTag('catalog', 'max')
}

// ---------------------------------------------------------------------------
// createProduct
// ---------------------------------------------------------------------------

export async function createProduct(
  rawInput: unknown,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = productDbSchema.safeParse(rawInput)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Datos inválidos'
    return { success: false, error: firstError, code: 400 }
  }

  const input = parsed.data

  try {
    const images = input.imageUrl ? [{ url: input.imageUrl, alt: input.name, position: 0 }] : []
    const stock = input.stock ?? 0

    const product = await db.product.create({
      data: {
        sku: input.sku,
        slug: input.slug || slugify(input.name),
        name: input.name,
        description: input.description ?? '',
        price: input.price,
        salePrice: input.salePrice ?? null,
        status: input.status ?? 'AVAILABLE',
        featured: input.featured,
        categoryId: input.categoryId,
        brandId: input.brandId,
        images: { create: images.map((img, i) => ({ ...img, position: img.position ?? i })) },
        inventory: { create: { availableStock: stock } },
      },
      select: PRODUCT_DETAIL_SELECT,
    })

    invalidateProductCaches()
    return { success: true, data: { id: product.id, slug: product.slug } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al crear producto'
    // SKU duplicado es el caso más común
    if (message.includes('Unique constraint') || message.includes('unique')) {
      return { success: false, error: 'El SKU o slug ya existe', code: 409 }
    }
    return { success: false, error: message, code: 500 }
  }
}

// ---------------------------------------------------------------------------
// updateProduct
// ---------------------------------------------------------------------------

export async function updateProduct(
  id: string,
  rawInput: unknown,
  images?: { url: string; alt?: string }[],
): Promise<ActionResult<{ id: string }>> {
  const denied = await requireAdmin()
  if (denied) return denied

  if (!id) return { success: false, error: 'ID de producto requerido', code: 400 }

  const parsed = productDbBaseSchema.partial().safeParse(rawInput)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Datos inválidos'
    return { success: false, error: firstError, code: 400 }
  }

  const input = parsed.data

  try {
    const updated = await db.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id },
        data: {
          ...(input.sku !== undefined && { sku: input.sku }),
          ...(input.name !== undefined && { name: input.name }),
          ...(input.slug !== undefined && { slug: input.slug }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.price !== undefined && { price: input.price }),
          ...(input.salePrice !== undefined && { salePrice: input.salePrice ?? null }),
          ...(input.status !== undefined && { status: input.status }),
          ...(input.featured !== undefined && { featured: input.featured }),
          ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
          ...(input.brandId !== undefined && { brandId: input.brandId }),
        },
        select: PRODUCT_DETAIL_SELECT,
      })

      if (input.stock !== undefined) {
        await tx.productInventory.upsert({
          where: { productId: id },
          update: { availableStock: input.stock },
          create: { productId: id, availableStock: input.stock },
        })
      }

      // Sincroniza imágenes: elimina las existentes y crea las nuevas
      if (images !== undefined) {
        await tx.productImage.deleteMany({ where: { productId: id } })
        if (images.length > 0) {
          await tx.productImage.createMany({
            data: images.map((img, i) => ({
              productId: id,
              url: img.url,
              alt: img.alt ?? null,
              position: i,
            })),
          })
        }
      }

      return product
    })

    invalidateProductCaches()
    return { success: true, data: { id: updated.id } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al actualizar producto'
    return { success: false, error: message, code: 500 }
  }
}

// ---------------------------------------------------------------------------
// deleteProduct
// ---------------------------------------------------------------------------

export async function deleteProduct(id: string): Promise<ActionResult> {
  const denied = await requireAdmin()
  if (denied) return denied

  if (!id) return { success: false, error: 'ID de producto requerido', code: 400 }

  try {
    await db.product.update({ where: { id }, data: { deletedAt: new Date() } })
    invalidateProductCaches()
    return { success: true, data: undefined }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al eliminar producto'
    return { success: false, error: message, code: 500 }
  }
}

// ---------------------------------------------------------------------------
// importProducts
// Recibe filas del Excel ya parseadas por el cliente, las valida y las inserta.
// Estrategia: upsert por SKU (update si existe, create si no).
// ---------------------------------------------------------------------------

const importRowSchema = z.array(importProductRowSchema)

type ImportRow = z.infer<typeof importProductRowSchema>

export async function importProducts(
  rawRows: unknown,
): Promise<ActionResult<{ created: number; updated: number; errors: string[] }>> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = importRowSchema.safeParse(rawRows)
  if (!parsed.success) {
    return { success: false, error: 'Formato de importación inválido', code: 400 }
  }

  const rows = parsed.data
  const errors: string[] = []
  let created = 0
  let updated = 0

  // Mapas dinámicos: la celda puede traer el nombre o el slug de la
  // categoría/marca; se normaliza con slugify para comparar sin tildes ni case.
  const [categories, brands] = await Promise.all([
    getCategories({ perPage: 100 }),
    getBrands({ perPage: 100 }),
  ])

  const catMap = new Map<string, string>()
  for (const c of categories) {
    catMap.set(c.slug, c.id)
    catMap.set(slugify(c.name), c.id)
  }

  const brandMap = new Map<string, string>()
  for (const b of brands) {
    brandMap.set(b.slug, b.id)
    brandMap.set(slugify(b.name), b.id)
  }

  for (const row of rows) {
    try {
      const categoryId = catMap.get(slugify(row.cat))
      if (!categoryId) {
        errors.push(`Fila "${row.name}": categoría "${row.cat}" no encontrada`)
        continue
      }

      if (!row.brand) {
        errors.push(`Fila "${row.name}": marca requerida`)
        continue
      }

      const brandId = brandMap.get(slugify(row.brand))
      if (!brandId) {
        errors.push(`Fila "${row.name}": marca "${row.brand}" no encontrada`)
        continue
      }

      const slug = slugify(row.name) + '-' + row.sku.toLowerCase()
      const existing = await getProducts({ search: row.sku, take: 1 })
      const match = existing.find((p) => p.sku === row.sku)

      if (match) {
        const newImages = (row.imageUrls ?? []).map((url, i) => ({
          url,
          alt: row.name,
          position: i,
        }))

        await db.$transaction(async (tx) => {
          await tx.product.update({
            where: { id: match.id },
            data: {
              name: row.name,
              price: row.price,
              description: row.desc ?? '',
              salePrice: row.salePrice ?? null,
              status: row.status ?? 'AVAILABLE',
              featured: row.featured ?? false,
            },
          })

          if (newImages.length > 0) {
            await tx.productImage.deleteMany({ where: { productId: match.id } })
            await tx.productImage.createMany({
              data: newImages.map((img) => ({ ...img, productId: match.id })),
            })
          }

          await tx.productInventory.upsert({
            where: { productId: match.id },
            update: { availableStock: row.stock },
            create: { productId: match.id, availableStock: row.stock },
          })
        })
        updated++
      } else {
        const images = (row.imageUrls ?? []).map((url, i) => ({
          url,
          alt: row.name,
          position: i,
        }))

        await db.product.create({
          data: {
            sku: row.sku,
            slug,
            name: row.name,
            description: row.desc ?? '',
            price: row.price,
            salePrice: row.salePrice ?? null,
            categoryId,
            brandId,
            status: row.status ?? 'AVAILABLE',
            featured: row.featured ?? false,
            images: images.length > 0 ? { create: images } : undefined,
            inventory: { create: { availableStock: row.stock } },
          },
        })
        created++
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      errors.push(`Fila "${(row as ImportRow).name}": ${msg}`)
    }
  }

  invalidateProductCaches()
  return { success: true, data: { created, updated, errors } }
}

// ---------------------------------------------------------------------------
// getCatalogForExport
// Catálogo completo para exportar a PDF visual desde el admin. Las imágenes
// se descargan aquí (server-side, sin CORS) y viajan como data URLs; el
// cliente las normaliza a JPEG con canvas antes de incrustarlas en el PDF.
// ---------------------------------------------------------------------------

export interface CatalogExportRow {
  name: string
  sku: string
  category: string
  brand: string
  price: number
  salePrice: number | null
  status: string
  imageDataUrl: string | null
}

const MAX_IMAGE_BYTES = 4_000_000

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const type = res.headers.get('content-type') ?? 'image/jpeg'
    if (!type.startsWith('image/')) return null
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.byteLength === 0 || buf.byteLength > MAX_IMAGE_BYTES) return null
    return `data:${type};base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}

export async function getCatalogForExport(): Promise<ActionResult<CatalogExportRow[]>> {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const products = await db.product.findMany({
      where: { deletedAt: null, status: { not: 'ARCHIVED' } },
      select: {
        name: true,
        sku: true,
        price: true,
        salePrice: true,
        status: true,
        category: { select: { name: true } },
        brand: { select: { name: true } },
        images: { select: { url: true }, orderBy: { position: 'asc' }, take: 1 },
      },
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
    })

    const images = await Promise.all(
      products.map((p) => (p.images[0]?.url ? fetchImageAsDataUrl(p.images[0].url) : null)),
    )

    return {
      success: true,
      data: products.map((p, i) => ({
        name: p.name,
        sku: p.sku,
        category: p.category.name,
        brand: p.brand.name,
        price: Number(p.price),
        salePrice: p.salePrice != null ? Number(p.salePrice) : null,
        status: p.status,
        imageDataUrl: images[i],
      })),
    }
  } catch {
    return { success: false, error: 'Error al cargar el catálogo', code: 500 }
  }
}

// ---------------------------------------------------------------------------
// searchAvailableProducts
// Busca productos por nombre/SKU, excluyendo los IDs dados.
// Usada por EntityProductsDrawer para el flujo "Agregar producto".
// ---------------------------------------------------------------------------

export async function searchAvailableProducts(
  query: string,
  excludeIds: string[] = [],
): Promise<ActionResult<DrawerProduct[]>> {
  const denied = await requireAdmin()
  if (denied) return denied

  if (!query || query.trim().length < 2) {
    return { success: true, data: [] }
  }

  try {
    const products = await db.product.findMany({
      where: {
        deletedAt: null,
        id: excludeIds.length > 0 ? { notIn: excludeIds } : undefined,
        OR: [
          { name: { contains: query.trim(), mode: 'insensitive' } },
          { sku: { contains: query.trim(), mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        status: true,
        images: {
          select: { url: true },
          orderBy: { position: 'asc' },
          take: 1,
        },
        category: { select: { name: true } },
        brand: { select: { name: true } },
        inventory: { select: { availableStock: true } },
      },
      orderBy: { name: 'asc' },
      take: 20,
    })

    return {
      success: true,
      data: products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: Number(p.price),
        status: p.status,
        imageUrl: p.images[0]?.url ?? null,
        category: p.category.name,
        brand: p.brand.name,
        stock: p.inventory?.availableStock ?? 0,
      })),
    }
  } catch {
    return { success: false, error: 'Error al buscar productos', code: 500 }
  }
}
