'use server'

import { BRAND_SELECT, getBrandById, getBrandBySlug } from '@/features/brands/queries/brand.queries'
import { db } from '@/shared/lib/db'
import { slugify } from '@/shared/lib/utils'
import { requireAdmin } from '@/shared/lib/require-admin'
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

const createBrandSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
  slug: slugSchema,
  tagline: z.string().max(80).optional(),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url('URL de imagen inválida').optional().or(z.literal('')),
})

const updateBrandSchema = createBrandSchema.partial().extend({
  id: z.string().min(1, 'ID requerido'),
})

// ---------------------------------------------------------------------------
// Cache invalidation
// ---------------------------------------------------------------------------

function invalidateBrandCaches() {
  revalidatePath('/admin/brands')
  revalidatePath('/admin/products')
  revalidatePath('/admin/dashboard')
  revalidateTag('brands', 'max')
  revalidateTag('catalog', 'max')
}

// ---------------------------------------------------------------------------
// createBrand
// ---------------------------------------------------------------------------

export async function createBrand(rawInput: unknown): Promise<ActionResult<{ id: string }>> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = createBrandSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
      code: 400,
    }
  }

  const { name, slug, tagline, description, imageUrl } = parsed.data

  try {
    const existing = await getBrandBySlug(slug)
    if (existing) {
      return { success: false, error: 'Ya existe una marca con ese slug', code: 409 }
    }

    const created = await db.brand.create({
      data: {
        name,
        slug,
        tagline: tagline || null,
        description: description || null,
        imageUrl: imageUrl || null,
      },
      select: BRAND_SELECT,
    })

    invalidateBrandCaches()
    return { success: true, data: { id: created.id } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al crear marca'
    return { success: false, error: message, code: 500 }
  }
}

// ---------------------------------------------------------------------------
// updateBrand
// ---------------------------------------------------------------------------

export async function updateBrand(rawInput: unknown): Promise<ActionResult<{ id: string }>> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = updateBrandSchema.safeParse(rawInput)
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
      const existing = await getBrandBySlug(fields.slug)
      if (existing && existing.id !== id) {
        return { success: false, error: 'Ya existe una marca con ese slug', code: 409 }
      }
    }

    const updated = await db.brand.update({
      where: { id },
      data: {
        ...(fields.name !== undefined && { name: fields.name }),
        ...(fields.slug !== undefined && { slug: fields.slug }),
        ...(fields.tagline !== undefined && { tagline: fields.tagline || null }),
        ...(fields.description !== undefined && { description: fields.description || null }),
        ...(fields.imageUrl !== undefined && { imageUrl: fields.imageUrl || null }),
      },
      select: BRAND_SELECT,
    })

    invalidateBrandCaches()
    return { success: true, data: { id: updated.id } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al actualizar marca'
    return { success: false, error: message, code: 500 }
  }
}

// ---------------------------------------------------------------------------
// getBrandProducts
// ---------------------------------------------------------------------------

export async function getBrandProducts(brandId: string): Promise<ActionResult<DrawerProduct[]>> {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const products = await db.product.findMany({
      where: { deletedAt: null, brandId },
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
// reassignProductBrand
// ---------------------------------------------------------------------------

export async function reassignProductBrand(
  productId: string,
  newBrandId: string,
): Promise<ActionResult> {
  const denied = await requireAdmin()
  if (denied) return denied

  if (!productId || !newBrandId) {
    return { success: false, error: 'IDs de producto y marca requeridos', code: 400 }
  }

  try {
    await db.product.update({
      where: { id: productId },
      data: { brandId: newBrandId },
    })
    revalidatePath('/admin/brands')
    revalidatePath('/admin/products')
    revalidateTag('brands', 'max')
    revalidateTag('catalog', 'max')
    return { success: true, data: undefined }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al reasignar marca'
    return { success: false, error: message, code: 500 }
  }
}

// ---------------------------------------------------------------------------
// deleteBrand
// ---------------------------------------------------------------------------

export async function deleteBrand(id: string): Promise<ActionResult> {
  const denied = await requireAdmin()
  if (denied) return denied

  if (!id) return { success: false, error: 'ID de marca requerido', code: 400 }

  try {
    const brand = await getBrandById(id)
    if (!brand) return { success: false, error: 'Marca no encontrada', code: 404 }

    if (brand.productCount > 0) {
      return {
        success: false,
        error: `No se puede eliminar: la marca tiene ${brand.productCount} producto(s) asociado(s)`,
        code: 422,
      }
    }

    await db.brand.update({ where: { id }, data: { deletedAt: new Date() } })
    invalidateBrandCaches()
    return { success: true, data: undefined }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al eliminar marca'
    return { success: false, error: message, code: 500 }
  }
}

// ---------------------------------------------------------------------------
// importBrands
// Recibe filas del Excel ya parseadas por el cliente.
// Estrategia: upsert por slug (update si existe, create si no).
// ---------------------------------------------------------------------------

const importBrandRowSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
  slug: slugSchema.optional().or(z.literal('')).default(''),
  tagline: z.string().max(80).optional().default(''),
  description: z.string().max(500).optional().default(''),
  imageUrl: z.string().url('URL de imagen inválida').optional().or(z.literal('')).default(''),
})

export type ImportBrandRow = z.infer<typeof importBrandRowSchema>

export async function importBrands(
  rawRows: unknown,
): Promise<ActionResult<{ created: number; updated: number; errors: string[] }>> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = z.array(importBrandRowSchema).safeParse(rawRows)
  if (!parsed.success) {
    return { success: false, error: 'Formato de importación inválido', code: 400 }
  }

  const errors: string[] = []
  let created = 0
  let updated = 0

  for (const row of parsed.data) {
    try {
      const slug = row.slug || slugify(row.name)
      const existing = await getBrandBySlug(slug)

      const data = {
        name: row.name,
        tagline: row.tagline || null,
        description: row.description || null,
        imageUrl: row.imageUrl || null,
      }

      if (existing) {
        await db.brand.update({ where: { id: existing.id }, data })
        updated++
      } else {
        await db.brand.create({ data: { slug, ...data } })
        created++
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      errors.push(`Fila "${row.name}": ${msg}`)
    }
  }

  invalidateBrandCaches()
  return { success: true, data: { created, updated, errors } }
}
