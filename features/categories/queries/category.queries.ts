import 'server-only'
import { db } from '@/shared/lib/db'
import type { CategoryFilters, CategoryRow } from '@/features/categories/types'

export const CATEGORY_SELECT = {
  id: true,
  name: true,
  slug: true,
  parentId: true,
  description: true,
  imageUrl: true,
  _count: { select: { products: { where: { deletedAt: null } } } },
} as const

export function mapCategoryRow(c: {
  id: string
  name: string
  slug: string
  parentId: string | null
  description: string | null
  imageUrl: string | null
  _count: { products: number }
}): CategoryRow {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    parentId: c.parentId,
    description: c.description,
    imageUrl: c.imageUrl,
    productCount: c._count.products,
  }
}

export async function getCategories(filters: CategoryFilters = {}): Promise<CategoryRow[]> {
  const { search, page = 1, perPage = 50 } = filters
  const skip = (page - 1) * perPage

  const categories = await db.category.findMany({
    where: {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { slug: { contains: search } },
            ],
          }
        : {}),
    },
    select: CATEGORY_SELECT,
    orderBy: { name: 'asc' },
    skip,
    take: perPage,
  })

  return categories.map(mapCategoryRow)
}

export async function countCategories(
  filters: Pick<CategoryFilters, 'search'> = {},
): Promise<number> {
  const { search } = filters
  return db.category.count({
    where: {
      deletedAt: null,
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

export async function getCategoryBySlug(slug: string): Promise<CategoryRow | null> {
  const c = await db.category.findFirst({
    where: { slug, deletedAt: null },
    select: CATEGORY_SELECT,
  })
  return c ? mapCategoryRow(c) : null
}

export async function getCategoryById(id: string): Promise<CategoryRow | null> {
  const c = await db.category.findFirst({
    where: { id, deletedAt: null },
    select: CATEGORY_SELECT,
  })
  return c ? mapCategoryRow(c) : null
}
