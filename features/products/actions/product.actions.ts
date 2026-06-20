'use server'

import { brandRepo } from '@/features/brands/services/brand.service'
import { categoryRepo } from '@/features/categories/services/category.service'
import { productRepo } from '@/features/products/services/product.service'
import { db } from '@/shared/lib/db'
import { importProductRowSchema, productDbBaseSchema, productDbSchema } from '@/shared/lib/schemas'
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
  const parsed = productDbSchema.safeParse(rawInput)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Datos inválidos'
    return { success: false, error: firstError, code: 400 }
  }

  const input = parsed.data

  try {
    const product = await productRepo.create({
      sku: input.sku,
      slug: input.slug || slugify(input.name),
      name: input.name,
      description: input.description ?? '',
      price: input.price,
      compareAtPrice: input.compareAtPrice,
      salePrice: input.salePrice,
      status: input.status,
      featured: input.featured,
      categoryId: input.categoryId,
      brandId: input.brandId,
      stock: input.stock,
      images: input.imageUrl ? [{ url: input.imageUrl, alt: input.name, position: 0 }] : [],
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
  if (!id) return { success: false, error: 'ID de producto requerido', code: 400 }

  const parsed = productDbBaseSchema.partial().safeParse(rawInput)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Datos inválidos'
    return { success: false, error: firstError, code: 400 }
  }

  const input = parsed.data

  try {
    const updated = await productRepo.update({
      id,
      ...(input.sku !== undefined && { sku: input.sku }),
      ...(input.name !== undefined && { name: input.name }),
      ...(input.slug !== undefined && { slug: input.slug }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.price !== undefined && { price: input.price }),
      ...(input.compareAtPrice !== undefined && { compareAtPrice: input.compareAtPrice }),
      ...(input.salePrice !== undefined && { salePrice: input.salePrice }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.featured !== undefined && { featured: input.featured }),
      ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
      ...(input.brandId !== undefined && { brandId: input.brandId }),
      ...(input.stock !== undefined && { stock: input.stock }),
      // images: si se pasan, se sincronizan en la transacción del repo
      ...(images !== undefined && { images }),
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
  if (!id) return { success: false, error: 'ID de producto requerido' }

  try {
    await productRepo.delete(id)
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
  const parsed = importRowSchema.safeParse(rawRows)
  if (!parsed.success) {
    return { success: false, error: 'Formato de importación inválido', code: 400 }
  }

  const rows = parsed.data
  const errors: string[] = []
  let created = 0
  let updated = 0

  // Mapas para resolver categoryId y brandId por nombre/slug
  const [categories, brands] = await Promise.all([categoryRepo.findAll(), brandRepo.findAll()])

  const catMap: Record<string, string> = {
    figures: categories.find((c) => c.slug === 'figuras-accion')?.id ?? '',
    lego: categories.find((c) => c.slug === 'lego')?.id ?? '',
    vehicles: categories.find((c) => c.slug === 'modelos-escala')?.id ?? '',
  }

  for (const row of rows) {
    try {
      const categoryId = catMap[row.cat]
      if (!categoryId) {
        errors.push(`Fila "${row.name}": categoría "${row.cat}" no encontrada`)
        continue
      }

      // Resolución de marca: busca por nombre case-insensitive
      const brandName = (row.brand ?? '').toLowerCase()
      const brand = brands.find((b) => b.name.toLowerCase() === brandName)
      const brandId = brand?.id ?? brands[0]?.id

      if (!brandId) {
        errors.push(`Fila "${row.name}": no se encontró marca`)
        continue
      }

      const slug = slugify(row.name) + '-' + row.sku.toLowerCase()
      const existing = await productRepo.findMany({ search: row.sku, take: 1 })
      const match = existing.find((p) => p.sku === row.sku)

      if (match) {
        await productRepo.update({
          id: match.id,
          name: row.name,
          price: row.price,
          description: row.desc ?? '',
          stock: row.stock,
        })
        updated++
      } else {
        await productRepo.create({
          sku: row.sku,
          slug,
          name: row.name,
          description: row.desc ?? '',
          price: row.price,
          categoryId,
          brandId,
          stock: row.stock,
          status: 'AVAILABLE',
          featured: false,
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
// searchAvailableProducts
// Busca productos por nombre/SKU, excluyendo los IDs dados.
// Usada por EntityProductsDrawer para el flujo "Agregar producto".
// ---------------------------------------------------------------------------

export async function searchAvailableProducts(
  query: string,
  excludeIds: string[] = [],
): Promise<ActionResult<DrawerProduct[]>> {
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
