import 'server-only'
import { cachedQuery, CACHE_TAGS, REVALIDATE_LONG } from '@/shared/lib/data-cache'
import { db } from '@/shared/lib/db'
import { cache } from 'react'
import type { BrandFilters, BrandRow } from '@/features/brands/types'

export const BRAND_SELECT = {
  id: true,
  name: true,
  slug: true,
  tagline: true,
  description: true,
  imageUrl: true,
  _count: { select: { products: { where: { deletedAt: null } } } },
} as const

export function mapBrandRow(b: {
  id: string
  name: string
  slug: string
  tagline: string | null
  description: string | null
  imageUrl: string | null
  _count: { products: number }
}): BrandRow {
  return {
    id: b.id,
    name: b.name,
    slug: b.slug,
    tagline: b.tagline,
    description: b.description,
    imageUrl: b.imageUrl,
    productCount: b._count.products,
  }
}

async function fetchBrands(filters: BrandFilters = {}): Promise<BrandRow[]> {
  const { search, page = 1, perPage = 50 } = filters
  const skip = (page - 1) * perPage

  const brands = await db.brand.findMany({
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
    select: BRAND_SELECT,
    orderBy: { name: 'asc' },
    skip,
    take: perPage,
  })

  return brands.map(mapBrandRow)
}

/** Forma exacta del listado público: la piden la home y el layout de la tienda. */
const PUBLIC_BRANDS_FILTERS: BrandFilters = { perPage: 50 }
const PUBLIC_BRANDS_KEY = JSON.stringify(PUBLIC_BRANDS_FILTERS)

const getBrandsByKey = cache((key: string) =>
  // El listado público va a la caché entre requests; cualquier otro (admin,
  // búsqueda, actions) se lee fresco.
  key === PUBLIC_BRANDS_KEY ? getPublicBrands() : fetchBrands(JSON.parse(key) as BrandFilters),
)

/**
 * Listado (admin, actions, buscador): solo deduplicado por request — `cache()`
 * compara por identidad, por eso la clave es el JSON de los filtros.
 */
export function getBrands(filters: BrandFilters = {}): Promise<BrandRow[]> {
  return getBrandsByKey(JSON.stringify(filters))
}

/**
 * Listado público (inicio y filtros del catálogo), cacheado entre requests.
 * Forma fija para que haya una sola entrada. La invalidan 'brands' y 'catalog'
 * (este último lo disparan las actions de productos, que cambian el conteo).
 */
export const getPublicBrands = cache(
  cachedQuery(() => fetchBrands(PUBLIC_BRANDS_FILTERS), ['public-brands'], {
    tags: [CACHE_TAGS.brands, CACHE_TAGS.catalog],
    revalidate: REVALIDATE_LONG,
  }),
)

export async function countBrands(filters: Pick<BrandFilters, 'search'> = {}): Promise<number> {
  const { search } = filters
  return db.brand.count({
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

export async function getBrandBySlug(slug: string): Promise<BrandRow | null> {
  const b = await db.brand.findFirst({ where: { slug, deletedAt: null }, select: BRAND_SELECT })
  return b ? mapBrandRow(b) : null
}

export async function getBrandById(id: string): Promise<BrandRow | null> {
  const b = await db.brand.findFirst({ where: { id, deletedAt: null }, select: BRAND_SELECT })
  return b ? mapBrandRow(b) : null
}
