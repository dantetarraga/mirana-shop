'use server'

import { brandRepo } from '@/features/brands/services/brand.service'
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
    const existing = await brandRepo.findBySlug(slug)
    if (existing) {
      return { success: false, error: 'Ya existe una marca con ese slug', code: 409 }
    }

    const brand = await brandRepo.create({
      name,
      slug,
      tagline: tagline || undefined,
      description: description || undefined,
      imageUrl: imageUrl || undefined,
    })

    invalidateBrandCaches()
    return { success: true, data: { id: brand.id } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al crear marca'
    return { success: false, error: message, code: 500 }
  }
}

// ---------------------------------------------------------------------------
// updateBrand
// ---------------------------------------------------------------------------

export async function updateBrand(rawInput: unknown): Promise<ActionResult<{ id: string }>> {
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
      const existing = await brandRepo.findBySlug(fields.slug)
      if (existing && existing.id !== id) {
        return { success: false, error: 'Ya existe una marca con ese slug', code: 409 }
      }
    }

    const brand = await brandRepo.update(id, {
      ...fields,
      tagline: fields.tagline || undefined,
      imageUrl: fields.imageUrl || undefined,
      description: fields.description || undefined,
    })

    invalidateBrandCaches()
    return { success: true, data: { id: brand.id } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al actualizar marca'
    return { success: false, error: message, code: 500 }
  }
}

// ---------------------------------------------------------------------------
// getBrandProducts
// ---------------------------------------------------------------------------

export async function getBrandProducts(brandId: string): Promise<ActionResult<DrawerProduct[]>> {
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
    revalidateTag('brands')
    revalidateTag('catalog')
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
  if (!id) return { success: false, error: 'ID de marca requerido', code: 400 }

  try {
    const brand = await brandRepo.findById(id)
    if (!brand) return { success: false, error: 'Marca no encontrada', code: 404 }

    if (brand.productCount > 0) {
      return {
        success: false,
        error: `No se puede eliminar: la marca tiene ${brand.productCount} producto(s) asociado(s)`,
        code: 422,
      }
    }

    await brandRepo.softDelete(id)
    invalidateBrandCaches()
    return { success: true, data: undefined }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al eliminar marca'
    return { success: false, error: message, code: 500 }
  }
}
