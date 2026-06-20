'use server'

import {
  COLLECTION_SELECT,
  getCollectionBySlug,
} from '@/features/collections/queries/collection.queries'
import { db } from '@/shared/lib/db'
import type { ActionResult } from '@/shared/types/action-result.types'
import type { DrawerProduct } from '@/shared/types/entity-products.types'
import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Schemas Zod
// ---------------------------------------------------------------------------

const slugSchema = z
  .string()
  .min(1, 'Slug requerido')
  .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones')

const createCollectionSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
  slug: slugSchema,
  description: z.string().max(1000).optional(),
  imageUrl: z.string().url('URL de imagen inválida').optional().or(z.literal('')),
  active: z.boolean().default(true),
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
  revalidateTag('collections', 'max')
  revalidateTag('catalog', 'max')
}

// ---------------------------------------------------------------------------
// createCollection
// ---------------------------------------------------------------------------

export async function createCollection(rawInput: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = createCollectionSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
      code: 400,
    }
  }

  const { name, slug, description, imageUrl, active } = parsed.data

  try {
    const existing = await getCollectionBySlug(slug)
    if (existing) {
      return { success: false, error: 'Ya existe una colección con ese slug', code: 409 }
    }

    const collection = await db.collection.create({
      data: {
        name,
        slug,
        description: description || null,
        imageUrl: imageUrl || null,
        active: active ?? true,
      },
      select: COLLECTION_SELECT,
    })

    invalidateCollectionCaches()
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
  if (!id) return { success: false, error: 'ID de colección requerido', code: 400 }

  try {
    await db.collection.update({ where: { id }, data: { deletedAt: new Date() } })
    invalidateCollectionCaches()
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
    revalidateTag('collections', 'max')
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
  try {
    const products = await db.product.findMany({
      where: {
        deletedAt: null,
        collections: { some: { collectionId } },
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
