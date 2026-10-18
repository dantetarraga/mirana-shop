'use server'

import { getBrands } from '@/features/brands/queries/brand.queries'
import { getCategories } from '@/features/categories/queries/category.queries'
import { assertProductCanBeArchived, setAvailableStock } from '@/features/inventory/lib/stock'
import { findBestMatch } from '@/features/products/lib/catalog-match'
import { PRODUCT_DETAIL_SELECT } from '@/features/products/queries/product.queries'
import {
  findTrashedConflict,
  trashedConflictError,
} from '@/features/trash/lib/trashed-conflict'
import { findDrawerProducts } from '@/features/products/queries/drawer-product.queries'
import { db } from '@/shared/lib/db'
import { slugify, uniqueSlug } from '@/shared/lib/slug'
import { importProductRowSchema, productDbBaseSchema, productDbSchema } from '@/features/products/schemas/product.schema'
import { requireAdmin } from '@/shared/lib/require-admin'
import type { ActionResult } from '@/shared/types/action-result.types'
import type { DrawerProduct } from '@/shared/types/entity-products.types'
import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function invalidateProductCaches() {
  revalidatePath('/admin/products')
  revalidatePath('/admin/inventory')
  revalidatePath('/admin/dashboard')
  revalidatePath('/catalogo')
  revalidatePath('/')
  revalidateTag('products', 'max')
  revalidateTag('catalog', 'max')
}

/**
 * La categoría y la marca de un producto deben existir y no estar en la
 * papelera. Sin esto la FK aceptaba una categoría borrada (soft delete) y el
 * producto quedaba colgado de algo que la tienda ya no muestra. Devuelve el
 * mensaje de negocio, o null si todo está bien. Solo valida lo que llega.
 */
async function findCatalogRefError(refs: {
  categoryId?: string
  brandId?: string
}): Promise<string | null> {
  const [category, brand] = await Promise.all([
    refs.categoryId
      ? db.category.findUnique({ where: { id: refs.categoryId }, select: { name: true, deletedAt: true } })
      : null,
    refs.brandId
      ? db.brand.findUnique({ where: { id: refs.brandId }, select: { name: true, deletedAt: true } })
      : null,
  ])
  if (refs.categoryId) {
    if (!category) return 'La categoría elegida no existe. Elige otra.'
    if (category.deletedAt)
      return `La categoría "${category.name}" está en la papelera. Restáurala o elige otra.`
  }
  if (refs.brandId) {
    if (!brand) return 'La marca elegida no existe. Elige otra.'
    if (brand.deletedAt) return `La marca "${brand.name}" está en la papelera. Restáurala o elige otra.`
  }
  return null
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
    const slug = input.slug || slugify(input.name)

    const refError = await findCatalogRefError(input)
    if (refError) return { success: false, error: refError, code: 400 }

    const trashed = await findTrashedConflict('product', { slug, sku: input.sku })
    if (trashed) return { success: false, error: trashedConflictError(trashed), code: 409 }

    const product = await db.product.create({
      data: {
        sku: input.sku,
        slug,
        name: input.name,
        description: input.description ?? '',
        price: input.price,
        salePrice: input.salePrice ?? null,
        status: input.status ?? 'AVAILABLE',
        featured: input.featured,
        categoryId: input.categoryId,
        brandId: input.brandId,
        allowPartialPreorder: input.allowPartialPreorder,
        preorderDepositPercent: input.preorderDepositPercent ?? null,
        estimatedArrival: input.estimatedArrival ?? null,
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
    if (input.categoryId !== undefined || input.brandId !== undefined) {
      const refError = await findCatalogRefError(input)
      if (refError) return { success: false, error: refError, code: 400 }
    }

    if (input.slug !== undefined || input.sku !== undefined) {
      const trashed = await findTrashedConflict('product', { slug: input.slug, sku: input.sku }, id)
      if (trashed) return { success: false, error: trashedConflictError(trashed), code: 409 }
    }

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
          // `null` = limpiar el campo; `undefined` = no vino en el payload.
          ...(input.allowPartialPreorder !== undefined && {
            allowPartialPreorder: input.allowPartialPreorder,
          }),
          ...(input.preorderDepositPercent !== undefined && {
            preorderDepositPercent: input.preorderDepositPercent,
          }),
          ...(input.estimatedArrival !== undefined && { estimatedArrival: input.estimatedArrival }),
        },
        select: PRODUCT_DETAIL_SELECT,
      })

      if (input.status === 'ARCHIVED') await assertProductCanBeArchived(tx, id)

      if (input.stock !== undefined) await setAvailableStock(tx, id, input.stock)

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
    await db.$transaction(async (tx) => {
      // Bloquea primero el producto: una reserva concurrente debe terminar
      // antes de comprobar los compromisos, o fallar al verlo archivado.
      await tx.product.update({ where: { id }, data: { deletedAt: new Date() } })
      await assertProductCanBeArchived(tx, id)

      const [orderItemCount, preorderCount, movementCount] = await Promise.all([
        tx.orderItem.count({ where: { productId: id } }),
        tx.preorder.count({ where: { productId: id } }),
        tx.inventoryMovement.count({ where: { productId: id } }),
      ])

      if (orderItemCount === 0 && preorderCount === 0 && movementCount === 0) {
        // Sin historial: se conserva el borrado definitivo existente.
        await tx.product.delete({ where: { id } })
      } else {
        // La papelera conserva el inventario completo y todos sus contadores.
        await tx.cartItem.deleteMany({ where: { productId: id } })
      }
    })

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
      // Sin el tope de 100 de antes: con más categorías/marcas el match no
      // las veía y la importación creaba duplicados.
      getCategories({ perPage: 5000 }),
      getBrands({ perPage: 5000 }),
    ])
    categoryRefs = categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))
    brandRefs = brands.map((b) => ({ id: b.id, name: b.name, slug: b.slug }))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'No se pudo cargar categorías/marcas'
    return { success: false, error: message, code: 500 }
  }

  // Slugs ocupados, incluidos los de la papelera (siguen reservando el índice
  // único): sin esto una categoría/marca nueva podía chocar con una borrada.
  let takenCategorySlugs: Set<string>
  let takenBrandSlugs: Set<string>
  try {
    const [categorySlugs, brandSlugs] = await Promise.all([
      db.category.findMany({ select: { slug: true } }),
      db.brand.findMany({ select: { slug: true } }),
    ])
    takenCategorySlugs = new Set(categorySlugs.map((c) => c.slug))
    takenBrandSlugs = new Set(brandSlugs.map((b) => b.slug))
  } catch {
    return { success: false, error: 'No se pudo cargar categorías/marcas', code: 500 }
  }

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
        select: { id: true, deletedAt: true },
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
              allowPartialPreorder: row.allowPartialPreorder ?? false,
              preorderDepositPercent: row.depositPercent ?? null,
              estimatedArrival: row.estimatedArrival ?? null,
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

          if (row.status === 'ARCHIVED') await assertProductCanBeArchived(tx, match.id)

          await tx.productInventory.upsert({
            where: { productId: match.id },
            update: { availableStock: { increment: row.stock }, version: { increment: 1 } },
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
            allowPartialPreorder: row.allowPartialPreorder ?? false,
            preorderDepositPercent: row.depositPercent ?? null,
            estimatedArrival: row.estimatedArrival ?? null,
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
const EXPORT_IMAGE_HOSTS = new Set([
  'res.cloudinary.com',
  'images.unsplash.com',
  'plus.unsplash.com',
  'picsum.photos',
  'placehold.co',
])

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' || !EXPORT_IMAGE_HOSTS.has(parsed.hostname)) return null

    const res = await fetch(parsed, {
      signal: AbortSignal.timeout(8000),
      // No seguir redirecciones hacia hosts privados o no permitidos.
      redirect: 'error',
    })
    if (!res.ok) return null
    const type = res.headers.get('content-type') ?? 'image/jpeg'
    if (!type.startsWith('image/')) return null
    const declaredSize = Number(res.headers.get('content-length') ?? 0)
    if (declaredSize > MAX_IMAGE_BYTES || !res.body) return null

    const reader = res.body.getReader()
    const chunks: Uint8Array[] = []
    let bytes = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (bytes > MAX_IMAGE_BYTES) {
        await reader.cancel()
        return null
      }
      chunks.push(value)
    }
    if (bytes === 0) return null
    const buf = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)))
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
    const data = await findDrawerProducts({
      where: {
        id: excludeIds.length > 0 ? { notIn: excludeIds } : undefined,
        OR: [{ name: { contains: query.trim() } }, { sku: { contains: query.trim() } }],
      },
      take: 20,
    })
    return { success: true, data }
  } catch {
    return { success: false, error: 'Error al buscar productos', code: 500 }
  }
}
