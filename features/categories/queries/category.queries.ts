import 'server-only'
import { cachedQuery, CACHE_TAGS, REVALIDATE_LONG } from '@/shared/lib/data-cache'
import { db } from '@/shared/lib/db'
import { cache } from 'react'
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

async function fetchCategories(filters: CategoryFilters = {}): Promise<CategoryRow[]> {
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

/** Forma exacta del listado público: la piden la home y el layout de la tienda. */
const PUBLIC_CATEGORIES_FILTERS: CategoryFilters = { perPage: 50 }
const PUBLIC_CATEGORIES_KEY = JSON.stringify(PUBLIC_CATEGORIES_FILTERS)

const getCategoriesByKey = cache((key: string) =>
  // El listado público va a la caché entre requests; cualquier otro (admin,
  // búsqueda, actions) se lee fresco.
  key === PUBLIC_CATEGORIES_KEY ? getPublicCategories() : fetchCategories(JSON.parse(key) as CategoryFilters),
)

/**
 * Listado (admin, actions, buscador): solo deduplicado por request — `cache()`
 * compara por identidad, por eso la clave es el JSON de los filtros.
 */
export function getCategories(filters: CategoryFilters = {}): Promise<CategoryRow[]> {
  return getCategoriesByKey(JSON.stringify(filters))
}

/**
 * Listado público (inicio y filtros del catálogo), cacheado entre requests.
 * Forma fija para que haya una sola entrada. La invalidan 'categories' y 'catalog'
 * (este último lo disparan las actions de productos, que cambian el conteo).
 */
export const getPublicCategories = cache(
  cachedQuery(() => fetchCategories(PUBLIC_CATEGORIES_FILTERS), ['public-categories'], {
    tags: [CACHE_TAGS.categories, CACHE_TAGS.catalog],
    revalidate: REVALIDATE_LONG,
  }),
)

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
