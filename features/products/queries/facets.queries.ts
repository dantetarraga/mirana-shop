import 'server-only'
import {
  AVAILABILITY_OPTIONS,
  resolveAvailability,
  type AvailabilityOption,
} from '@/features/products/lib/availability'
import { buildWhere } from '@/features/products/queries/product.queries'
import type { ProductFilters } from '@/features/products/types'
import { cachedQuery, CACHE_TAGS, REVALIDATE_SHORT } from '@/shared/lib/data-cache'
import { db } from '@/shared/lib/db'
import { cache } from 'react'

// ---------------------------------------------------------------------------
// Conteos facetados del catálogo (docs/NAVEGACION-CATALOGO.md §2).
//
// Cada faceta cuenta con TODOS los demás filtros activos menos el suyo: así
// "Bandai (3)" dice cuántos productos quedarían al marcar Bandai con la
// categoría, el precio y la disponibilidad actuales. Solo se cuentan los
// estados públicos (buildWhere sin `status` → DEFAULT_CATALOG_STATUSES).
// El ámbito fijo de la página (/categorias/x, /marcas/x) se aplica siempre.
// ---------------------------------------------------------------------------

export interface FacetInput {
  search?: string
  priceMin?: number
  priceMax?: number
  onSale?: boolean
  hideOutOfStock?: boolean
  /** Ámbito de /categorias/[slug] (incluye subcategorías). */
  scopeCategorySlug?: string
  /** Ámbito de /marcas/[slug]. */
  scopeBrandSlug?: string
  /** Selección del usuario (se ignora la dimensión que fija el ámbito). */
  cats: string[]
  brands: string[]
  avail: AvailabilityOption[]
}

export interface CatalogFacets {
  /** categoryId → productos DIRECTOS (sumar hijas para el padre). */
  categories: Record<string, number>
  /** brandId → productos. */
  brands: Record<string, number>
  availability: Record<AvailabilityOption, number>
}

function slugs(scope: string | undefined, selected: string[]): string[] | undefined {
  if (scope) return [scope]
  return selected.length > 0 ? selected : undefined
}

async function fetchCatalogFacets(input: FacetInput): Promise<CatalogFacets> {
  const common: Omit<ProductFilters, 'take' | 'skip'> = {
    search: input.search,
    priceMin: input.priceMin,
    priceMax: input.priceMax,
    onSale: input.onSale,
    hideOutOfStock: input.hideOutOfStock,
  }
  const categorySlug = slugs(input.scopeCategorySlug, input.cats)
  const brandSlug = slugs(input.scopeBrandSlug, input.brands)
  const availability = input.avail.length > 0 ? resolveAvailability(input.avail) : {}

  const [byCategory, byBrand, ...availCounts] = await Promise.all([
    db.product.groupBy({
      by: ['categoryId'],
      where: buildWhere({
        ...common,
        ...availability,
        brandSlug,
        categorySlug: input.scopeCategorySlug,
      }),
      _count: { _all: true },
    }),
    db.product.groupBy({
      by: ['brandId'],
      where: buildWhere({
        ...common,
        ...availability,
        categorySlug,
        brandSlug: input.scopeBrandSlug,
      }),
      _count: { _all: true },
    }),
    ...AVAILABILITY_OPTIONS.map(({ value }) =>
      db.product.count({
        where: buildWhere({ ...common, ...resolveAvailability([value]), categorySlug, brandSlug }),
      }),
    ),
  ])

  return {
    categories: Object.fromEntries(byCategory.map((g) => [g.categoryId, g._count._all])),
    brands: Object.fromEntries(byBrand.map((g) => [g.brandId, g._count._all])),
    availability: Object.fromEntries(
      AVAILABILITY_OPTIONS.map(({ value }, i) => [value, availCounts[i] ?? 0]),
    ) as Record<AvailabilityOption, number>,
  }
}

const fetchCatalogFacetsCached = cachedQuery(fetchCatalogFacets, ['catalog-facets'], {
  tags: [CACHE_TAGS.products, CACHE_TAGS.catalog],
  revalidate: REVALIDATE_SHORT,
})

// Igual que el listado: la búsqueda libre y los precios tecleados no van a la
// caché entre requests (una entrada por combinación); el resto sí.
const getFacetsByKey = cache((key: string) => {
  const input = JSON.parse(key) as FacetInput
  const cacheable = !input.search && input.priceMin == null && input.priceMax == null
  return cacheable ? fetchCatalogFacetsCached(input) : fetchCatalogFacets(input)
})

/** Conteos facetados — deduplicados por request (y entre requests si no hay texto/precio). */
export function getCatalogFacets(input: FacetInput): Promise<CatalogFacets> {
  return getFacetsByKey(JSON.stringify(input))
}
