import { getPublicBrands } from '@/features/brands/queries/brand.queries'
import { getPublicCategories } from '@/features/categories/queries/category.queries'
import { CatalogFilters } from '@/features/products/components/CatalogFilters'
import { CatalogPagination } from '@/features/products/components/CatalogPagination'
import { CatalogSortSelect } from '@/features/products/components/CatalogSortSelect'
import { ProductCard } from '@/features/products/components/ProductCard'
import { resolveAvailability } from '@/features/products/lib/availability'
import {
  CATALOG_PAGE_SIZE,
  hasProductFilters,
  toUrlParams,
  type CatalogParams,
} from '@/features/products/lib/catalog-params'
import { buildCatalogUrl } from '@/features/products/lib/catalog-url'
import { toProductCards } from '@/features/products/lib/product-card'
import { getCatalogFacets } from '@/features/products/queries/facets.queries'
import {
  countCatalogProducts,
  getCatalogProducts,
} from '@/features/products/queries/product.queries'
import { getHideOutOfStock } from '@/features/settings/queries/store-settings.queries'
import { buttonClass } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { SearchX } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

// ---------------------------------------------------------------------------
// Listado con filtros, orden y paginación — lo comparten /catalogo,
// /categorias/[slug] y /marcas/[slug]. Las dos últimas fijan un ÁMBITO
// (categoría con sus subcategorías, o marca) que se aplica siempre y no viaja
// en la URL; el resto de filtros son los mismos del catálogo.
// ---------------------------------------------------------------------------

interface CatalogBrowserProps {
  params: CatalogParams
  /** Página que lista; los enlaces de filtros/orden/paginación apuntan aquí. */
  basePath: string
  scope?: { categorySlug?: string; brandSlug?: string }
  /** Grupos de filtros a mostrar (precio y disponibilidad siempre están). */
  showCategoryFilter?: boolean
  showBrandFilter?: boolean
  /** Cards previas a los productos (colecciones en /catalogo sin filtros). */
  leading?: ReactNode[]
  /** Texto del estado vacío cuando NO hay filtros (el ámbito está vacío). */
  emptyScopeText?: string
}

export async function CatalogBrowser({
  params,
  basePath,
  scope = {},
  showCategoryFilter = false,
  showBrandFilter = false,
  leading = [],
  emptyScopeText = 'Aún no hay productos aquí. Vuelve pronto.',
}: CatalogBrowserProps) {
  const { status, stockFilter } = resolveAvailability(params.avail)
  // En una página de ámbito se ignora el parámetro de esa misma dimensión
  // (en /categorias/lego un `?cat=` no tiene sentido).
  const cats = scope.categorySlug ? [] : params.cats
  const brands = scope.brandSlug ? [] : params.brands

  const filters = {
    categorySlug: scope.categorySlug ?? (cats.length > 0 ? cats : undefined),
    brandSlug: scope.brandSlug ?? (brands.length > 0 ? brands : undefined),
    search: params.q,
    priceMin: params.priceMin,
    priceMax: params.priceMax,
    status,
    stockFilter,
    onSale: params.onSale,
    sort: params.sort,
  }

  // Productos y facetas dependen del ajuste de stock; categorías y marcas no.
  const hideOutOfStockPromise = getHideOutOfStock()

  const [products, total, facets, categories, brandRows] = await Promise.all([
    hideOutOfStockPromise.then((hideOutOfStock) =>
      getCatalogProducts({
        ...filters,
        hideOutOfStock,
        take: CATALOG_PAGE_SIZE,
        skip: (params.page - 1) * CATALOG_PAGE_SIZE,
      }),
    ),
    hideOutOfStockPromise.then((hideOutOfStock) =>
      countCatalogProducts({ ...filters, hideOutOfStock }),
    ),
    hideOutOfStockPromise.then((hideOutOfStock) =>
      getCatalogFacets({
        search: params.q,
        priceMin: params.priceMin,
        priceMax: params.priceMax,
        onSale: params.onSale,
        hideOutOfStock,
        scopeCategorySlug: scope.categorySlug,
        scopeBrandSlug: scope.brandSlug,
        cats,
        brands,
        avail: params.avail,
      }),
    ),
    showCategoryFilter ? getPublicCategories() : Promise.resolve([]),
    showBrandFilter ? getPublicBrands() : Promise.resolve([]),
  ])

  const items = toProductCards(products)
  const totalPages = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE))
  const urlParams = { ...toUrlParams(params), cat: cats, brand: brands }
  const filtered = hasProductFilters({ ...params, cats, brands })

  // Al cliente solo viaja lo que pinta el panel. Una marca sin ningún
  // producto público nunca puede dar resultados: no se ofrece.
  const filterCategories = categories.map(({ id, name, slug, parentId }) => ({ id, name, slug, parentId }))
  const filterBrands = brandRows
    .filter((b) => b.productCount > 0 || brands.includes(b.slug))
    .map(({ id, name, slug }) => ({ id, name, slug }))

  const { sort, ...sortBase } = urlParams

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[260px_1fr] gap-6 lg:gap-8 lg:items-start">
      <CatalogFilters
        basePath={basePath}
        categories={filterCategories}
        brands={filterBrands}
        facets={facets}
        currentQ={params.q}
        currentSort={sort}
        currentCats={cats}
        currentBrands={brands}
        currentAvail={params.avail}
        currentOferta={params.onSale}
        priceMin={params.priceMin}
        priceMax={params.priceMax}
      />

      <div>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <p aria-live="polite" className="flex items-baseline gap-2.5">
            <span className="font-display text-[42px] font-black leading-none tabular-nums">{total}</span>
            <span className="text-[12px] text-muted tracking-[1px] uppercase">
              {total === 1 ? 'producto' : 'productos'}
            </span>
          </p>
          <CatalogSortSelect value={params.sort} baseParams={sortBase} basePath={basePath} />
        </div>

        {items.length === 0 && leading.length === 0 ? (
          <EmptyState
            as="h2"
            size="page"
            icon={SearchX}
            title={params.q ? `Sin resultados para “${params.q}”` : 'Sin resultados'}
            description={filtered ? 'Prueba con menos filtros o con otra búsqueda.' : emptyScopeText}
            action={
              <Link
                href={filtered ? buildCatalogUrl({}, basePath) : '/catalogo'}
                className={buttonClass({ variant: 'outline', size: 'md' })}
              >
                {filtered ? 'Quitar filtros' : 'Ver todo el catálogo'}
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
            {leading}
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        <CatalogPagination
          currentPage={params.page}
          totalPages={totalPages}
          baseParams={urlParams}
          basePath={basePath}
        />
      </div>
    </div>
  )
}
