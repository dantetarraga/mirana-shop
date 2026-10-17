import 'server-only'
import type {
  BrandFilters,
  BrandPageData,
  BrandRow,
  PublicBrand,
  PublicBrandsOptions,
} from '@/features/brands/types'
import { getPublicCategories } from '@/features/categories/queries/category.queries'
import { DEFAULT_CATALOG_STATUSES } from '@/features/products/lib/availability'
import { cachedQuery, CACHE_TAGS, REVALIDATE_LONG } from '@/shared/lib/data-cache'
import { db } from '@/shared/lib/db'
import { cache } from 'react'

const BASE_SELECT = {
  id: true,
  name: true,
  slug: true,
  tagline: true,
  description: true,
  imageUrl: true,
  heroUrl: true,
  position: true,
  isVisible: true,
  featured: true,
} as const

/** Admin: cuenta todos los productos no borrados (cualquier estado). */
export const BRAND_SELECT = {
  ...BASE_SELECT,
  _count: { select: { products: { where: { deletedAt: null } } } },
} as const

const PUBLIC_PRODUCT_WHERE = {
  deletedAt: null,
  status: { in: DEFAULT_CATALOG_STATUSES },
}

const PUBLIC_BRAND_SELECT = {
  ...BASE_SELECT,
  _count: { select: { products: { where: PUBLIC_PRODUCT_WHERE } } },
} as const

export function mapBrandRow(b: {
  id: string
  name: string
  slug: string
  tagline: string | null
  description: string | null
  imageUrl: string | null
  heroUrl: string | null
  position: number
  isVisible: boolean
  featured: boolean
  _count: { products: number }
}): BrandRow {
  return {
    id: b.id,
    name: b.name,
    slug: b.slug,
    tagline: b.tagline,
    description: b.description,
    imageUrl: b.imageUrl,
    heroUrl: b.heroUrl,
    position: b.position,
    isVisible: b.isVisible,
    featured: b.featured,
    productCount: b._count.products,
  }
}

function searchWhere(search?: string) {
  return {
    deletedAt: null,
    ...(search
      ? { OR: [{ name: { contains: search } }, { slug: { contains: search } }] }
      : {}),
  }
}

const BRAND_ORDER = [{ position: 'asc' as const }, { name: 'asc' as const }]

// ---------------------------------------------------------------------------
// Admin / actions / buscador — lectura fresca
// ---------------------------------------------------------------------------

async function fetchBrands(filters: BrandFilters = {}): Promise<BrandRow[]> {
  const { search, page = 1, perPage = 50 } = filters
  const brands = await db.brand.findMany({
    where: searchWhere(search),
    select: BRAND_SELECT,
    orderBy: BRAND_ORDER,
    skip: (page - 1) * perPage,
    take: perPage,
  })
  return brands.map(mapBrandRow)
}

/** Forma histórica del listado público: se redirige a getPublicBrands(). */
const PUBLIC_BRANDS_KEY = JSON.stringify({ perPage: 50 } satisfies BrandFilters)

const getBrandsByKey = cache((key: string) =>
  key === PUBLIC_BRANDS_KEY ? getPublicBrands() : fetchBrands(JSON.parse(key) as BrandFilters),
)

/**
 * Listado (admin, actions, buscador): solo deduplicado por request — `cache()`
 * compara por identidad, por eso la clave es el JSON de los filtros.
 */
export function getBrands(filters: BrandFilters = {}): Promise<BrandRow[]> {
  return getBrandsByKey(JSON.stringify(filters))
}

/** Todas las marcas vivas del admin (lista ordenable, sin paginar). */
export async function getAdminBrands(): Promise<BrandRow[]> {
  const brands = await db.brand.findMany({
    where: { deletedAt: null },
    select: BRAND_SELECT,
    orderBy: BRAND_ORDER,
  })
  return brands.map(mapBrandRow)
}

export async function countBrands(filters: Pick<BrandFilters, 'search'> = {}): Promise<number> {
  return db.brand.count({ where: searchWhere(filters.search) })
}

/** Marca viva por slug (admin/actions). */
export async function findBrandBySlug(slug: string): Promise<BrandRow | null> {
  const b = await db.brand.findFirst({ where: { slug, deletedAt: null }, select: BRAND_SELECT })
  return b ? mapBrandRow(b) : null
}

/** Marca viva por id (admin/actions). */
export async function findBrandById(id: string): Promise<BrandRow | null> {
  const b = await db.brand.findFirst({ where: { id, deletedAt: null }, select: BRAND_SELECT })
  return b ? mapBrandRow(b) : null
}

// ---------------------------------------------------------------------------
// Tienda — caché entre requests (tags 'brands', 'catalog', 'products')
// ---------------------------------------------------------------------------

const PUBLIC_BRAND_CACHE = {
  tags: [CACHE_TAGS.brands, CACHE_TAGS.catalog, CACHE_TAGS.products],
  revalidate: REVALIDATE_LONG,
}

async function fetchPublicBrands(featuredOnly: boolean): Promise<PublicBrand[]> {
  const brands = await db.brand.findMany({
    where: { deletedAt: null, isVisible: true, ...(featuredOnly && { featured: true }) },
    select: PUBLIC_BRAND_SELECT,
    orderBy: BRAND_ORDER,
  })
  return brands.map(mapBrandRow)
}

const fetchPublicBrandsCached = cachedQuery(fetchPublicBrands, ['public-brands'], PUBLIC_BRAND_CACHE)
const getPublicBrandsBy = cache((featuredOnly: boolean) => fetchPublicBrandsCached(featuredOnly))

/**
 * Marcas visibles —sin tope— ordenadas por `position` (orden del admin), con
 * conteo público. Incluye las que tienen 0 productos: el consumidor decide si
 * ocultarlas. `featuredOnly` → solo las destacadas (mega-menú; aplicar
 * MENU_MAX_FEATURED_BRANDS al pintar).
 */
export function getPublicBrands(options: PublicBrandsOptions = {}): Promise<PublicBrand[]> {
  return getPublicBrandsBy(options.featuredOnly ?? false)
}

async function fetchBrandPage(slug: string): Promise<BrandPageData | null> {
  const brand = await db.brand.findFirst({
    where: { slug, deletedAt: null, isVisible: true },
    select: PUBLIC_BRAND_SELECT,
  })
  if (!brand) return null

  const groups = await db.product.groupBy({
    by: ['categoryId'],
    where: { ...PUBLIC_PRODUCT_WHERE, brandId: brand.id },
    _count: { _all: true },
  })
  return {
    brand: mapBrandRow(brand),
    // Solo id + conteo: nombre y slug se completan con la lista pública de
    // categorías (ver getBrandBySlug).
    categories: groups.map((g) => ({
      id: g.categoryId,
      name: '',
      slug: '',
      parentId: null,
      productCount: g._count._all,
    })),
  }
}

const fetchBrandPageCached = cachedQuery(fetchBrandPage, ['brand-page'], PUBLIC_BRAND_CACHE)

/**
 * /marcas/[slug]: la marca (visible, no borrada) y las categorías visibles
 * donde tiene productos públicos, de más a menos productos. null → notFound().
 */
export const getBrandBySlug = cache(async (slug: string): Promise<BrandPageData | null> => {
  const [data, categories] = await Promise.all([
    fetchBrandPageCached(slug),
    getPublicCategories(),
  ])
  if (!data) return null

  // Los nombres salen de la lista pública cacheada: así una categoría oculta
  // o en la papelera no aparece entre los chips.
  const byId = new Map(categories.map((c) => [c.id, c]))
  return {
    brand: data.brand,
    categories: data.categories
      .flatMap((g) => {
        const c = byId.get(g.id)
        return c
          ? [{ id: c.id, name: c.name, slug: c.slug, parentId: c.parentId, productCount: g.productCount }]
          : []
      })
      .sort((a, b) => b.productCount - a.productCount || a.name.localeCompare(b.name, 'es')),
  }
})
