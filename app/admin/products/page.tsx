import { ProductsClient } from '@/features/products/components/ProductsClient'
import { ProductFilters } from '@/features/products/components/ProductFilters'
import { getBrands } from '@/features/brands/queries/brand.queries'
import { getCategories } from '@/features/categories/queries/category.queries'
import { getCollections } from '@/features/collections/queries/collection.queries'
import { getHomeSectionOptions } from '@/features/home-sections/queries/home-section.queries'
import { PRODUCT_STATUS_LABELS, parseProductStatuses } from '@/features/products/lib/product-status'
import { countProducts, getAdminProducts } from '@/features/products/queries/product.queries'
import { getPreorderDepositPercent } from '@/features/settings/queries/store-settings.queries'
import { AdminPagination } from '@/shared/components/admin/AdminPagination'
import { ADMIN_PER_PAGE } from '@/shared/lib/admin/pagination'
import { ServerSearchForm } from '@/shared/components/admin/ServerSearchForm'
import { X } from 'lucide-react'

const PER_PAGE = ADMIN_PER_PAGE

interface PageProps {
  searchParams: Promise<{
    q?: string
    cat?: string
    brand?: string
    collection?: string
    status?: string
    page?: string
  }>
}

function buildUrl(params: Record<string, string | string[] | undefined>) {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (!v) continue
    const val = Array.isArray(v) ? v.join(',') : v
    if (val) p.set(k, val)
  }
  const qs = p.toString()
  return qs ? `/admin/products?${qs}` : '/admin/products'
}

const chipCls =
  'group flex items-center gap-1.5 px-2.5 py-1 bg-(--sub) border border-(--bd) hover:border-(--gold) transition-colors'

export default async function ProductsPage({ searchParams }: PageProps) {
  const { q, cat, brand, collection, status, page: rawPage } = await searchParams
  const page = Math.max(1, Number(rawPage ?? 1))
  const skip = (page - 1) * PER_PAGE

  const categorySlugs = cat ? cat.split(',').filter(Boolean) : []
  const brandSlugs = brand ? brand.split(',').filter(Boolean) : []
  const collectionSlugs = collection ? collection.split(',').filter(Boolean) : []
  // El listado del admin muestra todos los estados salvo que se pida alguno:
  // así el filtro vacío sigue incluyendo archivados, como hasta ahora.
  const statuses = parseProductStatuses(status)

  const queryFilters = {
    search: q,
    categorySlug: categorySlugs.length > 0 ? categorySlugs : undefined,
    brandSlug: brandSlugs.length > 0 ? brandSlugs : undefined,
    collectionSlug: collectionSlugs.length > 0 ? collectionSlugs : undefined,
    status: statuses.length > 0 ? statuses : ('ALL' as const),
  }

  const [products, categories, brands, collections, sections, total, defaultDepositPercent] =
    await Promise.all([
      getAdminProducts({ ...queryFilters, take: PER_PAGE, skip }),
      getCategories(),
      getBrands(),
      getCollections({ perPage: 200 }),
      getHomeSectionOptions(),
      countProducts(queryFilters),
      getPreorderDepositPercent(),
    ])

  // Serializar Decimals — todos los campos Decimal deben convertirse
  const serializedProducts = products.map((p) => ({
    ...p,
    price: Number(p.price),
    salePrice: p.salePrice != null ? Number(p.salePrice) : null,
  }))

  const totalPages = Math.ceil(total / PER_PAGE)
  const currentQ = q ?? ''

  // Los filtros de lista viajan en la URL con estas mismas claves: se pasan
  // enteros a cada enlace y solo se cambia el que toca.
  const activeFilters = {
    cat: categorySlugs,
    brand: brandSlugs,
    collection: collectionSlugs,
    status: statuses,
  }

  const hasFilters =
    currentQ !== '' || Object.values(activeFilters).some((values) => values.length > 0)

  // Un descriptor por filtro para no repetir el mismo chip cuatro veces.
  const chipGroups = [
    {
      key: 'cat' as const,
      prefix: 'Cat',
      values: categorySlugs,
      labelOf: (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug,
    },
    {
      key: 'brand' as const,
      prefix: 'Marca',
      values: brandSlugs,
      labelOf: (slug: string) => brands.find((b) => b.slug === slug)?.name ?? slug,
    },
    {
      key: 'collection' as const,
      prefix: 'Col',
      values: collectionSlugs,
      labelOf: (slug: string) => collections.find((c) => c.slug === slug)?.name ?? slug,
    },
    {
      key: 'status' as const,
      prefix: 'Estado',
      values: statuses,
      labelOf: (value: string) =>
        PRODUCT_STATUS_LABELS[value as keyof typeof PRODUCT_STATUS_LABELS] ?? value,
    },
  ]

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-5 lg:pt-7 pb-12">
      {/* Filtros */}
      <div className="flex flex-col gap-2.5 mb-4.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <ServerSearchForm
            placeholder="Buscar producto o SKU..."
            defaultValue={currentQ}
            paramName="q"
            extraParams={Object.fromEntries(
              Object.entries(activeFilters)
                .filter(([, values]) => values.length > 0)
                .map(([key, values]) => [key, values.join(',')]),
            )}
          />
          <ProductFilters
            categories={categories}
            brands={brands}
            collections={collections}
            currentQ={currentQ}
            currentCats={categorySlugs}
            currentBrands={brandSlugs}
            currentCollections={collectionSlugs}
            currentStatuses={statuses}
          />
          {hasFilters && (
            <a
              href="/admin/products"
              className="ml-auto text-[11px] text-muted hover:text-text transition-colors underline underline-offset-2 whitespace-nowrap"
            >
              Limpiar todo
            </a>
          )}
        </div>

        {/* Chips de filtros activos */}
        {hasFilters && (
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-[10px] uppercase tracking-widest text-muted font-bold font-display">
              Activos:
            </span>
            {currentQ && (
              <a href={buildUrl(activeFilters)} className={chipCls}>
                <span className="text-[11px] text-muted">Búsqueda:</span>
                <span className="text-[11px] text-text font-semibold">{currentQ}</span>
                <X size={10} className="text-muted group-hover:text-accent-ink transition-colors" />
              </a>
            )}
            {chipGroups.flatMap((group) =>
              group.values.map((value) => (
                <a
                  key={`${group.key}-${value}`}
                  href={buildUrl({
                    q: currentQ || undefined,
                    ...activeFilters,
                    [group.key]: group.values.filter((v) => v !== value),
                  })}
                  className={chipCls}
                >
                  <span className="text-[11px] text-muted">{group.prefix}:</span>
                  <span className="text-[11px] text-text font-semibold">
                    {group.labelOf(value)}
                  </span>
                  <X
                    size={10}
                    className="text-muted group-hover:text-accent-ink transition-colors"
                  />
                </a>
              )),
            )}
          </div>
        )}
      </div>

      <ProductsClient
        initialProducts={serializedProducts}
        categories={categories}
        brands={brands}
        collections={collections}
        sections={sections}
        total={total}
        defaultDepositPercent={defaultDepositPercent}
      />

      <AdminPagination
        page={page}
        totalPages={totalPages}
        total={total}
        perPage={PER_PAGE}
        className="mt-4"
        buildHref={(p) => buildUrl({ q: currentQ || undefined, ...activeFilters, page: String(p) })}
      />
    </div>
  )
}
