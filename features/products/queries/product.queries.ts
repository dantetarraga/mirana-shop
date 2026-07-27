import type {
  ProductAdminListItem,
  ProductDetail,
  ProductFilters,
  ProductListItem,
} from '@/features/products/types'
import { DEFAULT_CATALOG_STATUSES } from '@/features/products/lib/availability'
import { db } from '@/shared/lib/db'
import 'server-only'

const LOW_STOCK_THRESHOLD = 8

export const PRODUCT_LIST_SELECT = {
  id: true,
  sku: true,
  slug: true,
  name: true,
  price: true,
  salePrice: true,
  status: true,
  featured: true,
  createdAt: true,
  // Preventa parcial: las cards, el modal y el PDP necesitan poder calcular el
  // adelanto sin una consulta extra (ver features/checkout/lib/preorder.ts).
  allowPartialPreorder: true,
  preorderDepositPercent: true,
  estimatedArrival: true,
  category: { select: { id: true, name: true, slug: true } },
  brand: { select: { id: true, name: true, slug: true } },
  images: {
    select: { id: true, url: true, alt: true, position: true },
    orderBy: { position: 'asc' as const },
    // Sin take: 1 — necesitamos todas las imágenes para el form de edición
  },
  inventory: { select: { availableStock: true } },
  collections: {
    // Las colecciones se borran en soft: sin este filtro el producto seguiría
    // mostrando chips de colecciones que ya no existen (y esas filas gastarían
    // los 3 cupos del take).
    where: { collection: { deletedAt: null } },
    select: {
      collection: { select: { id: true, name: true, slug: true } },
    },
    take: 3,
  },
} as const

// El listado público no necesita la descripción (puede ser HTML largo), pero
// el listado del admin sí: es lo que alimenta el formulario de edición.
export const PRODUCT_ADMIN_LIST_SELECT = {
  ...PRODUCT_LIST_SELECT,
  description: true,
} as const

export const PRODUCT_DETAIL_SELECT = {
  ...PRODUCT_LIST_SELECT,
  description: true,
  currency: true,
  createdAt: true,
  updatedAt: true,
  images: {
    select: { id: true, url: true, alt: true, position: true },
    orderBy: { position: 'asc' as const },
  },
} as const

function buildWhere(filters: Omit<ProductFilters, 'take' | 'skip'>) {
  const {
    categorySlug,
    brandSlug,
    collectionSlug,
    search,
    featured,
    status,
    stockFilter,
    hideOutOfStock,
    priceMin,
    priceMax,
    onSale,
  } = filters

  const catSlugs = categorySlug
    ? Array.isArray(categorySlug)
      ? categorySlug
      : [categorySlug]
    : undefined
  const brdSlugs = brandSlug ? (Array.isArray(brandSlug) ? brandSlug : [brandSlug]) : undefined
  const colSlugs = collectionSlug
    ? Array.isArray(collectionSlug)
      ? collectionSlug
      : [collectionSlug]
    : undefined

  // Omitir `status` significa "lo que ve el público": disponible, preventa y
  // agotado. Antes el implícito era solo AVAILABLE, así que cualquier consumidor
  // que no lo pasara (buscador, relacionados) escondía las preventas sin querer
  // y contradecía a /catalogo, que sí las lista. Para incluirlo todo —vistas de
  // admin— hay que pedir 'ALL' explícitamente.
  const statusWhere =
    status === undefined
      ? { in: DEFAULT_CATALOG_STATUSES }
      : status === 'ALL'
        ? undefined
        : Array.isArray(status)
          ? { in: status }
          : status

  const inventoryWhere =
    stockFilter === 'low'
      ? { inventory: { availableStock: { gt: 0, lte: LOW_STOCK_THRESHOLD } } }
      : stockFilter === 'out'
        ? { inventory: { availableStock: 0 } }
        : stockFilter === 'in'
          ? { inventory: { availableStock: { gt: 0 } } }
          : {}

  const priceWhere =
    priceMin != null || priceMax != null
      ? { price: { gte: priceMin ?? undefined, lte: priceMax ?? undefined } }
      : {}

  // "No mostrar productos sin stock": fuera los SOLD_OUT y los que se quedaron
  // en cero. La preventa se salva del filtro de inventario porque por
  // definición aún no tiene unidades — se reserva.
  const purchasableWhere = hideOutOfStock
    ? {
        NOT: { status: 'SOLD_OUT' as const },
        OR: [
          { status: 'PREORDER' as const },
          { inventory: { availableStock: { gt: 0 } } },
        ],
      }
    : {}

  return {
    deletedAt: null,
    status: statusWhere,
    featured: featured ?? undefined,
    category: catSlugs?.length ? { slug: { in: catSlugs } } : undefined,
    brand: brdSlugs?.length ? { slug: { in: brdSlugs } } : undefined,
    collections: colSlugs?.length
      ? { some: { collection: { slug: { in: colSlugs }, deletedAt: null } } }
      : undefined,
    // Va en AND para no chocar con el OR de purchasableWhere.
    AND: search
      ? [{ OR: [{ name: { contains: search } }, { sku: { contains: search } }] }]
      : undefined,
    salePrice: onSale ? { not: null } : undefined,
    ...inventoryWhere,
    ...priceWhere,
    ...purchasableWhere,
  }
}

function buildOrderBy(sort: ProductFilters['sort']) {
  switch (sort) {
    case 'price_asc':
      return [{ price: 'asc' as const }]
    case 'price_desc':
      return [{ price: 'desc' as const }]
    case 'newest':
      return [{ createdAt: 'desc' as const }]
    default:
      return [{ featured: 'desc' as const }, { createdAt: 'desc' as const }]
  }
}

export async function getProducts(filters: ProductFilters = {}): Promise<ProductListItem[]> {
  const { take = 50, skip = 0, sort } = filters

  return db.product.findMany({
    where: buildWhere(filters),
    select: PRODUCT_LIST_SELECT,
    orderBy: buildOrderBy(sort),
    take,
    skip,
  }) as Promise<ProductListItem[]>
}

/** Igual que getProducts pero incluyendo la descripción — solo para el admin. */
export async function getAdminProducts(
  filters: ProductFilters = {},
): Promise<ProductAdminListItem[]> {
  const { take = 50, skip = 0, sort } = filters

  return db.product.findMany({
    where: buildWhere(filters),
    select: PRODUCT_ADMIN_LIST_SELECT,
    orderBy: buildOrderBy(sort),
    take,
    skip,
  }) as Promise<ProductAdminListItem[]>
}

export async function getFeaturedProducts(take = 8): Promise<ProductListItem[]> {
  return db.product.findMany({
    where: {
      deletedAt: null,
      featured: true,
      status: 'AVAILABLE',
      inventory: { availableStock: { gt: 0 } },
    },
    select: PRODUCT_LIST_SELECT,
    orderBy: { createdAt: 'desc' },
    take,
  }) as Promise<ProductListItem[]>
}

export async function getNewProducts(
  take = 6,
  hideOutOfStock = false,
): Promise<ProductListItem[]> {
  return db.product.findMany({
    where: {
      deletedAt: null,
      status: 'AVAILABLE',
      ...(hideOutOfStock ? { inventory: { availableStock: { gt: 0 } } } : {}),
    },
    select: PRODUCT_LIST_SELECT,
    orderBy: { createdAt: 'desc' },
    take,
  }) as Promise<ProductListItem[]>
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  return db.product.findFirst({
    where: { slug, deletedAt: null },
    select: PRODUCT_DETAIL_SELECT,
  }) as Promise<ProductDetail | null>
}

export async function getProductById(id: string): Promise<ProductDetail | null> {
  return db.product.findFirst({
    where: { id, deletedAt: null },
    select: PRODUCT_DETAIL_SELECT,
  }) as Promise<ProductDetail | null>
}

export async function countProducts(
  filters: Omit<ProductFilters, 'take' | 'skip'> = {},
): Promise<number> {
  return db.product.count({ where: buildWhere(filters) })
}
