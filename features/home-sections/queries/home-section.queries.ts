import 'server-only'

import type {
  HomeSectionOption,
  HomeSectionRow,
  HomeSectionWithProducts,
} from '@/features/home-sections/types'
import { HOME_SECTION_MAX_ITEMS } from '@/features/home-sections/types'
import { DEFAULT_CATALOG_STATUSES } from '@/features/products/lib/availability'
import { PRODUCT_LIST_SELECT } from '@/features/products/queries/product.queries'
import type { ProductListItem } from '@/features/products/types'
import { db } from '@/shared/lib/db'

// ---------------------------------------------------------------------------
// Secciones del inicio. El admin las lista todas (necesita ver las ocultas para
// volver a mostrarlas); la tienda solo las activas y con sus productos.
// ---------------------------------------------------------------------------

const SECTION_SELECT = {
  id: true,
  title: true,
  eyebrow: true,
  ctaHref: true,
  position: true,
  active: true,
  _count: { select: { products: { where: { product: { deletedAt: null } } } } },
} as const

/** Todas las secciones, ocultas incluidas — para /admin/sections */
export async function getAdminHomeSections(): Promise<HomeSectionRow[]> {
  const rows = await db.homeSection.findMany({
    select: SECTION_SELECT,
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
  })

  return rows.map((s) => ({
    id: s.id,
    title: s.title,
    eyebrow: s.eyebrow,
    ctaHref: s.ctaHref,
    position: s.position,
    active: s.active,
    productCount: s._count.products,
  }))
}

/** Solo id y título — para los checkboxes de la ficha de producto */
export async function getHomeSectionOptions(): Promise<HomeSectionOption[]> {
  return db.homeSection.findMany({
    select: { id: true, title: true, active: true },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
  })
}

/**
 * Secciones activas con sus productos, listas para el inicio. Dos consultas y
 * el agrupado en memoria: una por sección sería N+1 y el inicio ya hace varias.
 *
 * Los productos pasan por el mismo filtro que el resto de la tienda (estados
 * públicos y el ajuste "mostrar productos sin stock"), así que enlazar un
 * archivado no lo saca a la portada.
 */
export async function getActiveHomeSections(
  hideOutOfStock: boolean,
): Promise<HomeSectionWithProducts[]> {
  const sections = await db.homeSection.findMany({
    where: { active: true },
    select: { id: true, title: true, eyebrow: true, ctaHref: true },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
  })

  if (sections.length === 0) return []

  const sectionIds = sections.map((s) => s.id)

  const products = await db.product.findMany({
    where: {
      deletedAt: null,
      status: { in: DEFAULT_CATALOG_STATUSES },
      homeSections: { some: { sectionId: { in: sectionIds } } },
      // Mismo criterio que el catálogo: fuera agotados y sin unidades, salvo
      // las preventas, que por definición todavía no tienen stock.
      ...(hideOutOfStock
        ? {
            NOT: { status: 'SOLD_OUT' as const },
            OR: [{ status: 'PREORDER' as const }, { inventory: { availableStock: { gt: 0 } } }],
          }
        : {}),
    },
    select: {
      ...PRODUCT_LIST_SELECT,
      homeSections: {
        where: { sectionId: { in: sectionIds } },
        select: { sectionId: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const bySection = new Map<string, ProductListItem[]>(sectionIds.map((id) => [id, []]))
  for (const { homeSections, ...product } of products) {
    for (const { sectionId } of homeSections) {
      const list = bySection.get(sectionId)
      if (list && list.length < HOME_SECTION_MAX_ITEMS) list.push(product as ProductListItem)
    }
  }

  // Una sección sin nada que mostrar no se pinta: dejaría un título huérfano.
  return sections
    .map((s) => ({ ...s, products: bySection.get(s.id) ?? [] }))
    .filter((s) => s.products.length > 0)
}
