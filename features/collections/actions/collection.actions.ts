'use server'

import {
  COLLECTION_SELECT,
  getCollectionBySlug,
} from '@/features/collections/queries/collection.queries'
import { collectionBaseSchema } from '@/features/collections/schemas/collection.schema'
import { findDrawerProducts } from '@/features/products/queries/drawer-product.queries'
import {
  findTrashedConflict,
  trashedConflictError,
} from '@/features/trash/lib/trashed-conflict'
import { db } from '@/shared/lib/db'
import { requireAdmin } from '@/shared/lib/require-admin'
import { isRichTextEmpty, sanitizeRichText } from '@/shared/lib/rich-text'
import type { ActionResult } from '@/shared/types/action-result.types'
import type { DrawerProduct } from '@/shared/types/entity-products.types'
import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Schemas Zod
// ---------------------------------------------------------------------------

// Los campos y límites salen del schema base que también usa el formulario;
// aquí solo se añade lo propio del servidor (saneado del HTML y productIds).
const createCollectionSchema = collectionBaseSchema.extend({
  description: collectionBaseSchema.shape.description
    .unwrap()
    .transform((value) => (isRichTextEmpty(value) ? '' : sanitizeRichText(value)))
    .optional(),
  /**
   * Productos elegidos en el drawer antes de que la colección exista. Se
   * asocian en el mismo create para que no quede una colección a medias si
   * algo falla después. `updateCollection` los ignora: en edición el panel de
   * productos ya trabaja directamente contra la BD.
   */
  productIds: z.array(z.string().min(1)).optional().default([]),
})

const updateCollectionSchema = createCollectionSchema.partial().extend({
  id: z.string().min(1, 'ID requerido'),
})

// ---------------------------------------------------------------------------
// Cache invalidation
// ---------------------------------------------------------------------------

function invalidateCollectionCaches() {
  revalidatePath('/admin/collections')
  revalidatePath('/admin/dashboard')
  revalidatePath('/')
  // Superficie pública: las colecciones encabezan el catálogo y tienen página
  // propia — ambas deben refrescarse al crear, editar o desactivar una.
  revalidatePath('/catalogo')
  revalidatePath('/colecciones/[slug]', 'page')
  revalidateTag('collections', 'max')
  revalidateTag('catalog', 'max')
}

// ---------------------------------------------------------------------------
// createCollection
// ---------------------------------------------------------------------------

export async function createCollection(rawInput: unknown): Promise<ActionResult<{ id: string }>> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = createCollectionSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
      code: 400,
    }
  }

  const { name, slug, description, imageUrl, active, productIds } = parsed.data

  try {
    const existing = await getCollectionBySlug(slug)
    if (existing) {
      return { success: false, error: 'Ya existe una colección con ese slug', code: 409 }
    }

    const trashed = await findTrashedConflict('collection', { name, slug })
    if (trashed) return { success: false, error: trashedConflictError(trashed), code: 409 }

    const uniqueProductIds = [...new Set(productIds)]

    const collection = await db.collection.create({
      data: {
        name,
        slug,
        description: description || null,
        imageUrl: imageUrl || null,
        active: active ?? true,
        ...(uniqueProductIds.length > 0 && {
          products: { create: uniqueProductIds.map((productId) => ({ productId })) },
        }),
      },
      select: COLLECTION_SELECT,
    })

    invalidateCollectionCaches()
    if (uniqueProductIds.length > 0) {
      revalidatePath('/admin/products')
      revalidateTag('products', 'max')
    }
    return { success: true, data: { id: collection.id } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al crear colección'
    return { success: false, error: message, code: 500 }
  }
}

// ---------------------------------------------------------------------------
// updateCollection
// ---------------------------------------------------------------------------

export async function updateCollection(rawInput: unknown): Promise<ActionResult<{ id: string }>> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = updateCollectionSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
      code: 400,
    }
  }

  const { id, ...fields } = parsed.data

  try {
    if (fields.slug) {
      const existing = await getCollectionBySlug(fields.slug)
      if (existing && existing.id !== id) {
        return { success: false, error: 'Ya existe una colección con ese slug', code: 409 }
      }
    }

    if (fields.slug || fields.name) {
      const trashed = await findTrashedConflict(
        'collection',
        { name: fields.name, slug: fields.slug },
        id,
      )
      if (trashed) return { success: false, error: trashedConflictError(trashed), code: 409 }
    }

    const collection = await db.collection.update({
      where: { id },
      data: {
        ...(fields.name !== undefined && { name: fields.name }),
        ...(fields.slug !== undefined && { slug: fields.slug }),
        ...(fields.description !== undefined && { description: fields.description || null }),
        ...(fields.imageUrl !== undefined && { imageUrl: fields.imageUrl || null }),
        ...(fields.active !== undefined && { active: fields.active }),
      },
      select: COLLECTION_SELECT,
    })

    invalidateCollectionCaches()
    return { success: true, data: { id: collection.id } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al actualizar colección'
    return { success: false, error: message, code: 500 }
  }
}

// ---------------------------------------------------------------------------
// deleteCollection
// ---------------------------------------------------------------------------

export async function deleteCollection(id: string): Promise<ActionResult> {
  const denied = await requireAdmin()
  if (denied) return denied

  if (!id) return { success: false, error: 'ID de colección requerido', code: 400 }

  try {
    // Soft delete: la colección va a la papelera (/admin/trash) y sus
    // asociaciones se conservan intactas para que restaurarla devuelva los
    // mismos productos. Que no se muestren mientras está borrada lo garantiza
    // el filtro `collection: { deletedAt: null }` de PRODUCT_LIST_SELECT.
    await db.collection.update({ where: { id }, data: { deletedAt: new Date() } })
    invalidateCollectionCaches()
    // Las filas de producto cambian (pierden el chip de la colección): hay que
    // refrescar también sus vistas.
    revalidatePath('/admin/products')
    revalidatePath('/catalogo/[slug]', 'page')
    revalidateTag('products', 'max')
    return { success: true, data: undefined }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al eliminar colección'
    return { success: false, error: message, code: 500 }
  }
}

// ---------------------------------------------------------------------------
// syncProductCollections — diff y aplica en una sola llamada
// ---------------------------------------------------------------------------

export async function syncProductCollections(
  productId: string,
  desiredIds: string[],
): Promise<ActionResult> {
  const denied = await requireAdmin()
  if (denied) return denied

  if (!productId) return { success: false, error: 'ID de producto requerido', code: 400 }

  try {
    const current = await db.productCollection.findMany({
      where: { productId },
      select: { collectionId: true },
    })
    const currentIds = new Set(current.map((r) => r.collectionId))
    const desiredSet = new Set(desiredIds)

    const toAdd = desiredIds.filter((id) => !currentIds.has(id))
    const toRemove = [...currentIds].filter((id) => !desiredSet.has(id))

    await Promise.all([
      ...toAdd.map((collectionId) =>
        db.productCollection.upsert({
          where: { productId_collectionId: { productId, collectionId } },
          create: { productId, collectionId },
          update: {},
        }),
      ),
      ...toRemove.map((collectionId) =>
        db.productCollection.deleteMany({ where: { productId, collectionId } }),
      ),
    ])

    revalidatePath('/admin/products')
    revalidateTag('products', 'max')
    invalidateCollectionCaches()
    return { success: true, data: undefined }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al sincronizar colecciones'
    return { success: false, error: message, code: 500 }
  }
}

// ---------------------------------------------------------------------------
// addProductToCollection
// ---------------------------------------------------------------------------

export async function addProductToCollection(
  collectionId: string,
  productId: string,
): Promise<ActionResult> {
  const denied = await requireAdmin()
  if (denied) return denied

  if (!collectionId || !productId) {
    return { success: false, error: 'IDs de colección y producto requeridos', code: 400 }
  }

  try {
    await db.productCollection.upsert({
      where: { productId_collectionId: { productId, collectionId } },
      create: { productId, collectionId },
      update: {},
    })
    invalidateCollectionCaches()
    revalidatePath(`/admin/collections`)
    return { success: true, data: undefined }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al agregar producto a colección'
    return { success: false, error: message, code: 500 }
  }
}

// ---------------------------------------------------------------------------
// getCollectionProducts
// ---------------------------------------------------------------------------

export async function getCollectionProducts(
  collectionId: string,
): Promise<ActionResult<DrawerProduct[]>> {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    return {
      success: true,
      data: await findDrawerProducts({ where: { collections: { some: { collectionId } } } }),
    }
  } catch {
    return { success: false, error: 'Error al cargar productos', code: 500 }
  }
}

// ---------------------------------------------------------------------------
// removeProductFromCollection
// ---------------------------------------------------------------------------

export async function removeProductFromCollection(
  collectionId: string,
  productId: string,
): Promise<ActionResult> {
  const denied = await requireAdmin()
  if (denied) return denied

  if (!collectionId || !productId) {
    return { success: false, error: 'IDs de colección y producto requeridos', code: 400 }
  }

  try {
    await db.productCollection.deleteMany({ where: { collectionId, productId } })
    invalidateCollectionCaches()
    return { success: true, data: undefined }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al quitar producto de colección'
    return { success: false, error: message, code: 500 }
  }
}
