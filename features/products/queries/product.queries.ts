import type {
  ProductDetail,
  ProductFilters,
  ProductListItem,
  StockFilter,
} from '@/features/products/types'
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
  category: { select: { id: true, name: true, slug: true } },
  brand: { select: { id: true, name: true, slug: true } },
  images: {
    select: { id: true, url: true, alt: true, position: true },
    orderBy: { position: 'asc' as const },
    // Sin take: 1 — necesitamos todas las imágenes para el form de edición
  },
  inventory: { select: { availableStock: true } },
  collections: {
    select: {
      collection: { select: { id: true, name: true, slug: true } },
    },
    take: 3,
  },
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

  const statusWhere =
    status === undefined
      ? ('AVAILABLE' as const)
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

  return {
    deletedAt: null,
    status: statusWhere,
    featured: featured ?? undefined,
    category: catSlugs?.length ? { slug: { in: catSlugs } } : undefined,
    brand: brdSlugs?.length ? { slug: { in: brdSlugs } } : undefined,
    collections: colSlugs?.length
      ? { some: { collection: { slug: { in: colSlugs } } } }
      : undefined,
    name: search ? { contains: search } : undefined,
    salePrice: onSale ? { not: null } : undefined,
    ...inventoryWhere,
    ...priceWhere,
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
  stockFilter?: StockFilter,
): Promise<ProductListItem[]> {
  return db.product.findMany({
    where: {
      deletedAt: null,
      status: 'AVAILABLE',
      ...(stockFilter === 'in' ? { inventory: { availableStock: { gt: 0 } } } : {}),
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
