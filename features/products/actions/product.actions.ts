'use server'

import { getBrands } from '@/features/brands/queries/brand.queries'
import { getCategories } from '@/features/categories/queries/category.queries'
import { findBestMatch } from '@/features/products/lib/catalog-match'
import { PRODUCT_DETAIL_SELECT } from '@/features/products/queries/product.queries'
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
// Resolución de categoría/marca durante la importación masiva: busca la
// opción más cercana (ver catalog-match.ts) y, si no hay ninguna lo bastante
// parecida, crea una nueva sobre la marcha.
// ---------------------------------------------------------------------------

interface CatalogRef {
  id: string
  name: string
  slug: string
}

function uniqueSlug(name: string, taken: Set<string>): string {
  const base = slugify(name) || 'item'
  let candidate = base
  let i = 2
  while (taken.has(candidate)) candidate = `${base}-${i++}`
  taken.add(candidate)
  return candidate
}

async function resolveOrCreateCatalogRef(
  rawName: string,
  refs: CatalogRef[],
  takenSlugs: Set<string>,
  create: (name: string, slug: string) => Promise<{ id: string }>,
): Promise<{ ref: CatalogRef; wasCreated: boolean }> {
  const name = rawName.trim()
  const matched = findBestMatch(name, refs)
  if (matched) return { ref: matched, wasCreated: false }

  const slug = uniqueSlug(name, takenSlugs)
  const created = await create(name, slug)
  const ref: CatalogRef = { id: created.id, name, slug }
  refs.push(ref)
  return { ref, wasCreated: true }
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
    const [orderItemCount, preorderCount, movementCount] = await Promise.all([
      db.orderItem.count({ where: { productId: id } }),
      db.preorder.count({ where: { productId: id } }),
      db.inventoryMovement.count({ where: { productId: id } }),
    ])

    if (orderItemCount === 0 && preorderCount === 0 && movementCount === 0) {
      // Sin historial de pedidos/preórdenes/movimientos: borrado real y completo.
      // La cascada de Prisma limpia ProductInventory, ProductImage, CartItem y ProductCollection.
      await db.product.delete({ where: { id } })
    } else {
      // Tiene historial ligado (OrderItem/Preorder/InventoryMovement no cascadean
      // a propósito, para no romper pedidos pasados) — soft delete, pero sin dejar
      // basura: se elimina el inventario y los carritos que quedarían huérfanos.
      await db.$transaction([
        db.cartItem.deleteMany({ where: { productId: id } }),
        db.productInventory.deleteMany({ where: { productId: id } }),
        db.product.update({ where: { id }, data: { deletedAt: new Date() } }),
      ])
    }

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
): Promise<
  ActionResult<{
    created: number
    updated: number
    errors: string[]
    newCategories: string[]
    newBrands: string[]
  }>
> {
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
  const newCategories: string[] = []
  const newBrands: string[] = []

  let categoryRefs: CatalogRef[]
  let brandRefs: CatalogRef[]
  try {
    // Se cargan una sola vez y se van resolviendo/actualizando fila a fila:
    // la celda puede traer el nombre, el slug, o una variante cercana
    // (tildes/mayúsculas/typos/abreviaciones) de una categoría/marca
    // existente — ver findBestMatch. Si no hay match, se crea una nueva y se
    // agrega a la lista para que filas siguientes del mismo archivo la reusen
    // en vez de crear duplicados.
    const [categories, brands] = await Promise.all([
      getCategories({ perPage: 100 }),
      getBrands({ perPage: 100 }),
    ])
    categoryRefs = categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))
    brandRefs = brands.map((b) => ({ id: b.id, name: b.name, slug: b.slug }))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'No se pudo cargar categorías/marcas'
    return { success: false, error: message, code: 500 }
  }

  const takenCategorySlugs = new Set(categoryRefs.map((c) => c.slug))
  const takenBrandSlugs = new Set(brandRefs.map((b) => b.slug))

  for (const row of rows) {
    try {
      const { ref: categoryRef, wasCreated: categoryWasCreated } = await resolveOrCreateCatalogRef(
        row.cat,
        categoryRefs,
        takenCategorySlugs,
        (name, slug) => db.category.create({ data: { name, slug }, select: { id: true } }),
      )
      const categoryId = categoryRef.id
      if (categoryWasCreated) newCategories.push(categoryRef.name)

      if (!row.brand) {
        errors.push(`Fila "${row.name}": marca requerida`)
        continue
      }

      const { ref: brandRef, wasCreated: brandWasCreated } = await resolveOrCreateCatalogRef(
        row.brand,
        brandRefs,
        takenBrandSlugs,
        (name, slug) => db.brand.create({ data: { name, slug }, select: { id: true } }),
      )
      const brandId = brandRef.id
      if (brandWasCreated) newBrands.push(brandRef.name)

      const slug = slugify(row.name) + '-' + row.sku.toLowerCase()
      // Búsqueda exacta por SKU (es @unique) — evita depender de `contains`,
      // que en MySQL/MariaDB se traduce a `LIKE CONCAT(...)` y dispara un bug
      // del driver ("Illegal mix of collations") con ciertas versiones del
      // servidor.
      const match = await db.product.findUnique({
        where: { sku: row.sku },
        select: { id: true, deletedAt: true, inventory: { select: { availableStock: true } } },
      })

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
              // Reimportar un SKU que estaba soft-deleted lo reactiva — si el
              // admin lo está subiendo de nuevo es porque quiere que vuelva.
              ...(match.deletedAt !== null && { deletedAt: null }),
            },
          })

          if (newImages.length > 0) {
            await tx.productImage.deleteMany({ where: { productId: match.id } })
            await tx.productImage.createMany({
              data: newImages.map((img) => ({ ...img, productId: match.id })),
            })
          }

          const currentStock = match.inventory?.availableStock ?? 0
          await tx.productInventory.upsert({
            where: { productId: match.id },
            update: { availableStock: currentStock + row.stock },
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
  // La importación puede haber creado categorías/marcas nuevas sobre la marcha.
  revalidatePath('/admin/categories')
  revalidatePath('/admin/brands')
  revalidateTag('categories', 'max')
  revalidateTag('brands', 'max')
  return { success: true, data: { created, updated, errors, newCategories, newBrands } }
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
          { name: { contains: query.trim() } },
          { sku: { contains: query.trim() } },
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
