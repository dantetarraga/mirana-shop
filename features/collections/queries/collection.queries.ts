import 'server-only'
import { db } from '@/shared/lib/db'
import type {
  CollectionFilters,
  CollectionRow,
  CollectionWithProducts,
} from '@/features/collections/types'

export const COLLECTION_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  imageUrl: true,
  active: true,
  createdAt: true,
  _count: {
    select: {
      products: {
        where: {
          product: { deletedAt: null },
        },
      },
    },
  },
} as const

export function mapCollectionRow(c: {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  active: boolean
  createdAt: Date
  _count: { products: number }
}): CollectionRow {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    imageUrl: c.imageUrl,
    active: c.active,
    createdAt: c.createdAt,
    productCount: c._count.products,
  }
}

export async function getCollections(filters: CollectionFilters = {}): Promise<CollectionRow[]> {
  const { search, active, page = 1, perPage = 50 } = filters
  const skip = (page - 1) * perPage

  const rows = await db.collection.findMany({
    where: {
      deletedAt: null,
      ...(active !== undefined && { active }),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { slug: { contains: search } },
            ],
          }
        : {}),
    },
    select: COLLECTION_SELECT,
    orderBy: { name: 'asc' },
    skip,
    take: perPage,
  })

  return rows.map(mapCollectionRow)
}

export async function countCollections(
  filters: Pick<CollectionFilters, 'search' | 'active'> = {},
): Promise<number> {
  const { search, active } = filters
  return db.collection.count({
    where: {
      deletedAt: null,
      ...(active !== undefined && { active }),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { slug: { contains: search } },
            ],
          }
        : {}),
    },
  })
}

export async function getCollectionBySlug(slug: string): Promise<CollectionWithProducts | null> {
  const c = await db.collection.findFirst({
    where: { slug, deletedAt: null },
    select: {
      ...COLLECTION_SELECT,
      products: {
        where: { product: { deletedAt: null } },
        select: {
          productId: true,
          product: { select: { name: true, sku: true } },
        },
      },
    },
  })
  if (!c) return null
  return {
    ...mapCollectionRow(c),
    products: c.products.map((p) => ({
      productId: p.productId,
      name: p.product.name,
      sku: p.product.sku,
    })),
  }
}

export async function getCollectionById(id: string): Promise<CollectionWithProducts | null> {
  const c = await db.collection.findFirst({
    where: { id, deletedAt: null },
    select: {
      ...COLLECTION_SELECT,
      products: {
        where: { product: { deletedAt: null } },
        select: {
          productId: true,
          product: { select: { name: true, sku: true } },
        },
      },
    },
  })
  if (!c) return null
  return {
    ...mapCollectionRow(c),
    products: c.products.map((p) => ({
      productId: p.productId,
      name: p.product.name,
      sku: p.product.sku,
    })),
  }
}
