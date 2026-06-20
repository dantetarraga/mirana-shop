import 'server-only'
import { db } from '@/shared/lib/db'
import type { ProductDetail, ProductFilters, ProductListItem } from '@/features/products/types'

const LOW_STOCK_THRESHOLD = 8

export const PRODUCT_LIST_SELECT = {
  id: true,
  sku: true,
  slug: true,
  name: true,
  price: true,
  compareAtPrice: true,
  salePrice: true,
  status: true,
  featured: true,
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
  const { categorySlug, brandSlug, collectionSlug, search, featured, status = 'AVAILABLE', stockFilter } =
    filters

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

  const inventoryWhere =
    stockFilter === 'low'
      ? { inventory: { availableStock: { gt: 0, lte: LOW_STOCK_THRESHOLD } } }
      : stockFilter === 'out'
        ? { inventory: { availableStock: 0 } }
        : {}

  return {
    deletedAt: null,
    status: status ?? undefined,
    featured: featured ?? undefined,
    category: catSlugs?.length ? { slug: { in: catSlugs } } : undefined,
    brand: brdSlugs?.length ? { slug: { in: brdSlugs } } : undefined,
    collections: colSlugs?.length ? { some: { collection: { slug: { in: colSlugs } } } } : undefined,
    name: search ? { contains: search, mode: 'insensitive' as const } : undefined,
    ...inventoryWhere,
  }
}

export async function getProducts(filters: ProductFilters = {}): Promise<ProductListItem[]> {
  const { take = 50, skip = 0 } = filters

  return db.product.findMany({
    where: buildWhere(filters),
    select: PRODUCT_LIST_SELECT,
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    take,
    skip,
  }) as Promise<ProductListItem[]>
}

export async function getFeaturedProducts(take = 8): Promise<ProductListItem[]> {
  return db.product.findMany({
    where: { deletedAt: null, featured: true, status: 'AVAILABLE' },
    select: PRODUCT_LIST_SELECT,
    orderBy: { createdAt: 'desc' },
    take,
  }) as Promise<ProductListItem[]>
}

export async function getNewProducts(take = 6): Promise<ProductListItem[]> {
  return db.product.findMany({
    where: { deletedAt: null, status: 'AVAILABLE' },
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

export async function countProducts(filters: Omit<ProductFilters, 'take' | 'skip'> = {}): Promise<number> {
  return db.product.count({ where: buildWhere(filters) })
}
