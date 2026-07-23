'use server'

import { getBrands } from '@/features/brands/queries/brand.queries'
import { getCategories } from '@/features/categories/queries/category.queries'
import { db } from '@/shared/lib/db'
import { requireAdmin } from '@/shared/lib/require-admin'
import type { ActionResult } from '@/shared/types/action-result.types'

// ---------------------------------------------------------------------------
// Opciones para el selector de destino de los CTA de marketing (LinkPicker).
// ---------------------------------------------------------------------------

export interface LinkOption {
  /** Slug — es lo que viaja en la URL del storefront. */
  value: string
  label: string
  hint?: string
}

export interface LinkTargetOptions {
  categories: LinkOption[]
  brands: LinkOption[]
}

const PRODUCT_SEARCH_LIMIT = 15

export async function getLinkTargetOptions(): Promise<ActionResult<LinkTargetOptions>> {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const [categories, brands] = await Promise.all([
      getCategories({ perPage: 100 }),
      getBrands({ perPage: 100 }),
    ])

    return {
      success: true,
      data: {
        categories: categories.map((c) => ({
          value: c.slug,
          label: c.name,
          hint: `${c.productCount} producto${c.productCount !== 1 ? 's' : ''}`,
        })),
        brands: brands.map((b) => ({
          value: b.slug,
          label: b.name,
          hint: `${b.productCount} producto${b.productCount !== 1 ? 's' : ''}`,
        })),
      },
    }
  } catch {
    return { success: false, error: 'Error al cargar los destinos', code: 500 }
  }
}

/** Busca productos por nombre o SKU para enlazar a su ficha. */
export async function searchLinkProducts(query: string): Promise<ActionResult<LinkOption[]>> {
  const denied = await requireAdmin()
  if (denied) return denied

  const term = query.trim()
  if (term.length < 2) return { success: true, data: [] }

  try {
    const products = await db.product.findMany({
      where: {
        deletedAt: null,
        OR: [{ name: { contains: term } }, { sku: { contains: term } }],
      },
      select: { name: true, slug: true, sku: true },
      orderBy: { name: 'asc' },
      take: PRODUCT_SEARCH_LIMIT,
    })

    return {
      success: true,
      data: products.map((p) => ({ value: p.slug, label: p.name, hint: p.sku })),
    }
  } catch {
    return { success: false, error: 'Error al buscar productos', code: 500 }
  }
}

/** Resuelve el nombre del producto ya enlazado (para mostrarlo al editar). */
export async function getLinkProduct(slug: string): Promise<ActionResult<LinkOption | null>> {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const product = await db.product.findUnique({
      where: { slug },
      select: { name: true, slug: true, sku: true },
    })

    return {
      success: true,
      data: product ? { value: product.slug, label: product.name, hint: product.sku } : null,
    }
  } catch {
    return { success: false, error: 'Error al cargar el producto', code: 500 }
  }
}
