'use server'

import {
  CATEGORY_SELECT,
  getCategoryById,
  getCategoryBySlug,
} from '@/features/categories/queries/category.queries'
import { db } from '@/shared/lib/db'
import { requireAdmin } from '@/shared/lib/require-admin'
import { imageUrlSchema } from '@/shared/schemas/image-url.schema'
import { slugify } from '@/shared/lib/utils'
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
  imageUrl: imageUrlSchema().optional().or(z.literal('')),
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
  const denied = await requireAdmin()
  if (denied) return denied

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
    const existing = await getCategoryBySlug(slug)
    if (existing) {
      return { success: false, error: 'Ya existe una categoría con ese slug', code: 409 }
    }

    // Valida que el parentId existe si se proporciona
    if (parentId) {
      const parent = await getCategoryById(parentId)
      if (!parent) {
        return { success: false, error: 'Categoría padre no encontrada', code: 404 }
      }
    }

    const category = await db.category.create({
      data: {
        name,
        slug,
        parentId: parentId || null,
        description: description || null,
        imageUrl: imageUrl || null,
      },
      select: CATEGORY_SELECT,
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
  const denied = await requireAdmin()
  if (denied) return denied

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
      const existing = await getCategoryBySlug(fields.slug)
      if (existing && existing.id !== id) {
        return { success: false, error: 'Ya existe una categoría con ese slug', code: 409 }
      }
    }

    if (fields.parentId === id) {
      return { success: false, error: 'Una categoría no puede ser su propio padre', code: 422 }
    }

    const category = await db.category.update({
      where: { id },
      data: {
        ...(fields.name !== undefined && { name: fields.name }),
        ...(fields.slug !== undefined && { slug: fields.slug }),
        ...(fields.parentId !== undefined && { parentId: fields.parentId }),
        ...(fields.description !== undefined && { description: fields.description || null }),
        ...(fields.imageUrl !== undefined && { imageUrl: fields.imageUrl || null }),
      },
      select: CATEGORY_SELECT,
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
  const denied = await requireAdmin()
  if (denied) return denied

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
  const denied = await requireAdmin()
  if (denied) return denied

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
  const denied = await requireAdmin()
  if (denied) return denied

  if (!id) return { success: false, error: 'ID de categoría requerido', code: 400 }

  try {
    const category = await getCategoryById(id)
    if (!category) return { success: false, error: 'Categoría no encontrada', code: 404 }

    if (category.productCount > 0) {
      return {
        success: false,
        error: `No se puede eliminar: la categoría tiene ${category.productCount} producto(s) asociado(s)`,
        code: 422,
      }
    }

    await db.category.update({ where: { id }, data: { deletedAt: new Date() } })
    invalidateCategoryCaches()
    return { success: true, data: undefined }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al eliminar categoría'
    return { success: false, error: message, code: 500 }
  }
}

// ---------------------------------------------------------------------------
// importCategories
// Recibe filas del Excel ya parseadas por el cliente.
// Estrategia: upsert por slug. La columna "Padre" acepta nombre o slug de una
// categoría existente (o creada en una fila anterior del mismo archivo).
// ---------------------------------------------------------------------------

const importCategoryRowSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
  slug: slugSchema.optional().or(z.literal('')).default(''),
  parent: z.string().optional().default(''),
  description: z.string().max(500).optional().default(''),
  imageUrl: z.string().url('URL de imagen inválida').optional().or(z.literal('')).default(''),
})

export type ImportCategoryRow = z.infer<typeof importCategoryRowSchema>

export async function importCategories(
  rawRows: unknown,
): Promise<ActionResult<{ created: number; updated: number; errors: string[] }>> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = z.array(importCategoryRowSchema).safeParse(rawRows)
  if (!parsed.success) {
    return { success: false, error: 'Formato de importación inválido', code: 400 }
  }

  const errors: string[] = []
  let created = 0
  let updated = 0

  // Mapa nombre/slug (normalizados con slugify) → id, actualizado sobre la
  // marcha para que una fila pueda referenciar como padre a una anterior.
  const existing = await db.category.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, slug: true },
  })
  const idByKey = new Map<string, string>()
  for (const c of existing) {
    idByKey.set(c.slug, c.id)
    idByKey.set(slugify(c.name), c.id)
  }

  for (const row of parsed.data) {
    try {
      const slug = row.slug || slugify(row.name)

      let parentId: string | null = null
      if (row.parent) {
        parentId = idByKey.get(slugify(row.parent)) ?? null
        if (!parentId) {
          errors.push(`Fila "${row.name}": categoría padre "${row.parent}" no encontrada`)
          continue
        }
      }

      const existingId = idByKey.get(slug)

      if (existingId) {
        if (parentId === existingId) {
          errors.push(`Fila "${row.name}": una categoría no puede ser su propio padre`)
          continue
        }
        await db.category.update({
          where: { id: existingId },
          data: {
            name: row.name,
            parentId,
            description: row.description || null,
            imageUrl: row.imageUrl || null,
          },
        })
        updated++
      } else {
        const createdCat = await db.category.create({
          data: {
            name: row.name,
            slug,
            parentId,
            description: row.description || null,
            imageUrl: row.imageUrl || null,
          },
          select: { id: true },
        })
        idByKey.set(slug, createdCat.id)
        idByKey.set(slugify(row.name), createdCat.id)
        created++
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      errors.push(`Fila "${row.name}": ${msg}`)
    }
  }

  invalidateCategoryCaches()
  return { success: true, data: { created, updated, errors } }
}
