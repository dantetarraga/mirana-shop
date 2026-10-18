import type { AvailabilityOption } from '@/features/products/lib/availability'
import type { CatalogUrlParams } from '@/features/products/lib/catalog-url'
import type { ProductSort } from '@/features/products/types'

// ---------------------------------------------------------------------------
// Lectura de los searchParams de un listado (/catalogo, /categorias/[slug],
// /marcas/[slug]). Pura: se testea sin Next.
// ---------------------------------------------------------------------------

export const CATALOG_PAGE_SIZE = 24

const VALID_SORTS: readonly ProductSort[] = ['relevance', 'price_asc', 'price_desc', 'newest']
const VALID_AVAIL: readonly AvailabilityOption[] = ['in_stock', 'low_stock', 'preorder']

/** Lo que llega en `searchParams` (un parámetro repetido llega como array). */
export type RawCatalogSearchParams = Record<string, string | string[] | undefined>

export interface CatalogParams {
  q?: string
  cats: string[]
  brands: string[]
  avail: AvailabilityOption[]
  priceMin?: number
  priceMax?: number
  onSale?: true
  sort: ProductSort
  page: number
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function parseCsv(value: string | string[] | undefined): string[] {
  const raw = first(value)
  if (!raw) return []
  return [...new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))]
}

/** Precio del usuario: número finito y no negativo, o nada. */
function parsePrice(value: string | string[] | undefined): number | undefined {
  const raw = first(value)
  if (!raw) return undefined
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

export function parseCatalogParams(params: RawCatalogSearchParams): CatalogParams {
  const sort = first(params.sort) as ProductSort | undefined
  const page = Math.floor(Number(first(params.page)))
  return {
    q: first(params.q)?.trim() || undefined,
    cats: parseCsv(params.cat),
    brands: parseCsv(params.brand),
    avail: parseCsv(params.avail).filter((a): a is AvailabilityOption =>
      VALID_AVAIL.includes(a as AvailabilityOption),
    ),
    priceMin: parsePrice(params.priceMin),
    priceMax: parsePrice(params.priceMax),
    onSale: first(params.oferta) === '1' ? true : undefined,
    sort: sort && VALID_SORTS.includes(sort) ? sort : 'relevance',
    page: Number.isFinite(page) && page > 1 ? page : 1,
  }
}

/** ¿Hay algún filtro de producto activo? (el orden y la página no cuentan) */
export function hasProductFilters(p: CatalogParams): boolean {
  return (
    p.cats.length > 0 ||
    p.brands.length > 0 ||
    p.avail.length > 0 ||
    Boolean(p.q) ||
    Boolean(p.onSale) ||
    p.priceMin !== undefined ||
    p.priceMax !== undefined
  )
}

/** Parámetros de URL equivalentes (sin página) — base de filtros, orden y paginación. */
export function toUrlParams(p: CatalogParams): Omit<CatalogUrlParams, 'page'> {
  return {
    q: p.q,
    cat: p.cats,
    brand: p.brands,
    avail: p.avail,
    oferta: p.onSale,
    priceMin: p.priceMin,
    priceMax: p.priceMax,
    sort: p.sort,
  }
}

/**
 * Redirección de las URLs antiguas del catálogo: `?cat=x` o `?brand=x` como
 * ÚNICO parámetro (un solo valor) tienen ahora página propia e indexable.
 */
export function legacyCatalogRedirect(params: RawCatalogSearchParams): string | null {
  const keys = Object.keys(params).filter((k) => params[k] !== undefined && params[k] !== '')
  if (keys.length !== 1) return null
  const [key] = keys
  if (key !== 'cat' && key !== 'brand') return null
  const values = parseCsv(params[key])
  if (values.length !== 1 || Array.isArray(params[key])) return null
  const slug = encodeURIComponent(values[0])
  return key === 'cat' ? `/categorias/${slug}` : `/marcas/${slug}`
}
