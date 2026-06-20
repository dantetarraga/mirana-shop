'use server'

import { categoryRepo } from '@/features/categories/services/category.service'
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

const createCategorySchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
  slug: slugSchema,
  parentId: z.string().optional(),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url('URL de imagen inválida').optional().or(z.literal('')),
})

const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.string().min(1, 'ID requerido'),
})

// ---------------------------------------------------------------------------
// Cache invalidation
// ---------------------------------------------------------------------------

function invalidateCategoryCaches() {
  revalidatePath('/admin/categories')
  revalidatePath('/admin/products')
  revalidatePath('/admin/dashboard')
  revalidateTag('categories', 'max')
  revalidateTag('catalog', 'max')
}

// ---------------------------------------------------------------------------
// createCategory
// ---------------------------------------------------------------------------

export async function createCategory(rawInput: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = createCategorySchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
      code: 400,
    }
  }

  const { name, slug, parentId, description, imageUrl } = parsed.data

  try {
    const existing = await categoryRepo.findBySlug(slug)
    if (existing) {
      return { success: false, error: 'Ya existe una categoría con ese slug', code: 409 }
    }

    // Valida que el parentId existe si se proporciona
    if (parentId) {
      const parent = await categoryRepo.findById(parentId)
      if (!parent) {
        return { success: false, error: 'Categoría padre no encontrada', code: 404 }
      }
    }

    const category = await categoryRepo.create({
      name,
      slug,
      parentId: parentId || undefined,
      description: description || undefined,
      imageUrl: imageUrl || undefined,
    })

    invalidateCategoryCaches()
    return { success: true, data: { id: category.id } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al crear categoría'
    return { success: false, error: message, code: 500 }
  }
}

// ---------------------------------------------------------------------------
// updateCategory
// ---------------------------------------------------------------------------

export async function updateCategory(rawInput: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = updateCategorySchema.safeParse(rawInput)
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
      const existing = await categoryRepo.findBySlug(fields.slug)
      if (existing && existing.id !== id) {
        return { success: false, error: 'Ya existe una categoría con ese slug', code: 409 }
      }
    }

    if (fields.parentId === id) {
      return { success: false, error: 'Una categoría no puede ser su propio padre', code: 422 }
    }

    const category = await categoryRepo.update(id, {
      ...fields,
      imageUrl: fields.imageUrl || undefined,
      description: fields.description || undefined,
    })

    invalidateCategoryCaches()
    return { success: true, data: { id: category.id } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al actualizar categoría'
    return { success: false, error: message, code: 500 }
  }
}

// ---------------------------------------------------------------------------
// getCategoryProducts
// ---------------------------------------------------------------------------

export async function getCategoryProducts(
  categoryId: string,
): Promise<ActionResult<DrawerProduct[]>> {
  try {
    const products = await db.product.findMany({
      where: { deletedAt: null, categoryId },
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
// reassignProductCategory
// ---------------------------------------------------------------------------

export async function reassignProductCategory(
  productId: string,
  newCategoryId: string,
): Promise<ActionResult> {
  if (!productId || !newCategoryId) {
    return { success: false, error: 'IDs de producto y categoría requeridos', code: 400 }
  }

  try {
    await db.product.update({
      where: { id: productId },
      data: { categoryId: newCategoryId },
    })
    revalidatePath('/admin/categories')
    revalidatePath('/admin/products')
    revalidateTag('categories', 'max')
    revalidateTag('catalog', 'max')
    return { success: true, data: undefined }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al reasignar categoría'
    return { success: false, error: message, code: 500 }
  }
}

// ---------------------------------------------------------------------------
// deleteCategory
// ---------------------------------------------------------------------------

export async function deleteCategory(id: string): Promise<ActionResult> {
  if (!id) return { success: false, error: 'ID de categoría requerido', code: 400 }

  try {
    const category = await categoryRepo.findById(id)
    if (!category) return { success: false, error: 'Categoría no encontrada', code: 404 }

    if (category.productCount > 0) {
      return {
        success: false,
        error: `No se puede eliminar: la categoría tiene ${category.productCount} producto(s) asociado(s)`,
        code: 422,
      }
    }

    await categoryRepo.softDelete(id)
    invalidateCategoryCaches()
    return { success: true, data: undefined }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al eliminar categoría'
    return { success: false, error: message, code: 500 }
  }
}
