import { ProductsClient } from '@/features/products/components/ProductsClient'
import { ProductFilters } from '@/features/products/components/ProductFilters'
import { getBrands } from '@/features/brands/queries/brand.queries'
import { getCategories } from '@/features/categories/queries/category.queries'
import { getCollections } from '@/features/collections/queries/collection.queries'
import { countProducts, getProducts } from '@/features/products/queries/product.queries'
import { ServerSearchForm } from '@/shared/components/admin/ServerSearchForm'
import { cn } from '@/shared/lib/utils'
import { X } from 'lucide-react'

const PER_PAGE = 30

interface PageProps {
  searchParams: Promise<{
    q?: string
    cat?: string
    brand?: string
    collection?: string
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

export default async function ProductsPage({ searchParams }: PageProps) {
  const { q, cat, brand, collection, page: rawPage } = await searchParams
  const page = Math.max(1, Number(rawPage ?? 1))
  const skip = (page - 1) * PER_PAGE

  const categorySlugs = cat ? cat.split(',').filter(Boolean) : []
  const brandSlugs = brand ? brand.split(',').filter(Boolean) : []
  const collectionSlugs = collection ? collection.split(',').filter(Boolean) : []

  const [products, categories, brands, collections, total] = await Promise.all([
    getProducts({
      search: q,
      categorySlug: categorySlugs.length > 0 ? categorySlugs : undefined,
      brandSlug: brandSlugs.length > 0 ? brandSlugs : undefined,
      collectionSlug: collectionSlugs.length > 0 ? collectionSlugs : undefined,
      status: undefined,
      take: PER_PAGE,
      skip,
    }),
    getCategories(),
    getBrands(),
    getCollections({ perPage: 200 }),
    countProducts({
      search: q,
      categorySlug: categorySlugs.length > 0 ? categorySlugs : undefined,
      brandSlug: brandSlugs.length > 0 ? brandSlugs : undefined,
      collectionSlug: collectionSlugs.length > 0 ? collectionSlugs : undefined,
      status: undefined,
    }),
  ])

  // Serializar Decimals — todos los campos Decimal deben convertirse
  const serializedProducts = products.map((p) => ({
    ...p,
    price: Number(p.price),
    compareAtPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : null,
    salePrice: p.salePrice != null ? Number(p.salePrice) : null,
  }))

  const totalPages = Math.ceil(total / PER_PAGE)
  const currentQ = q ?? ''
  const hasFilters =
    currentQ !== '' ||
    categorySlugs.length > 0 ||
    brandSlugs.length > 0 ||
    collectionSlugs.length > 0

  return (
    <div className="px-8 pt-7 pb-12">
      {/* Filtros */}
      <div className="flex flex-col gap-2.5 mb-4.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <ServerSearchForm
            placeholder="Buscar producto o SKU..."
            defaultValue={currentQ}
            paramName="q"
            extraParams={{
              ...(categorySlugs.length > 0 && { cat: categorySlugs.join(',') }),
              ...(brandSlugs.length > 0 && { brand: brandSlugs.join(',') }),
              ...(collectionSlugs.length > 0 && { collection: collectionSlugs.join(',') }),
            }}
          />
          <ProductFilters
            categories={categories}
            brands={brands}
            collections={collections}
            currentQ={currentQ}
            currentCats={categorySlugs}
            currentBrands={brandSlugs}
            currentCollections={collectionSlugs}
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
              <a
                href={buildUrl({
                  cat: categorySlugs.length > 0 ? categorySlugs : undefined,
                  brand: brandSlugs.length > 0 ? brandSlugs : undefined,
                  collection: collectionSlugs.length > 0 ? collectionSlugs : undefined,
                })}
                className="group flex items-center gap-1.5 px-2.5 py-1 bg-(--sub) border border-(--bd) hover:border-(--gold) transition-colors"
              >
                <span className="text-[11px] text-muted">Búsqueda:</span>
                <span className="text-[11px] text-text font-semibold">{currentQ}</span>
                <X size={10} className="text-muted group-hover:text-(--gold) transition-colors" />
              </a>
            )}
            {categorySlugs.map((slug) => {
              const name = categories.find((c) => c.slug === slug)?.name ?? slug
              const remaining = categorySlugs.filter((s) => s !== slug)
              return (
                <a
                  key={`cat-${slug}`}
                  href={buildUrl({
                    q: currentQ || undefined,
                    cat: remaining.length > 0 ? remaining : undefined,
                    brand: brandSlugs.length > 0 ? brandSlugs : undefined,
                    collection: collectionSlugs.length > 0 ? collectionSlugs : undefined,
                  })}
                  className="group flex items-center gap-1.5 px-2.5 py-1 bg-(--sub) border border-(--bd) hover:border-(--gold) transition-colors"
                >
                  <span className="text-[11px] text-muted">Cat:</span>
                  <span className="text-[11px] text-text font-semibold">{name}</span>
                  <X size={10} className="text-muted group-hover:text-(--gold) transition-colors" />
                </a>
              )
            })}
            {brandSlugs.map((slug) => {
              const name = brands.find((b) => b.slug === slug)?.name ?? slug
              const remaining = brandSlugs.filter((s) => s !== slug)
              return (
                <a
                  key={`brd-${slug}`}
                  href={buildUrl({
                    q: currentQ || undefined,
                    cat: categorySlugs.length > 0 ? categorySlugs : undefined,
                    brand: remaining.length > 0 ? remaining : undefined,
                    collection: collectionSlugs.length > 0 ? collectionSlugs : undefined,
                  })}
                  className="group flex items-center gap-1.5 px-2.5 py-1 bg-(--sub) border border-(--bd) hover:border-(--gold) transition-colors"
                >
                  <span className="text-[11px] text-muted">Marca:</span>
                  <span className="text-[11px] text-text font-semibold">{name}</span>
                  <X size={10} className="text-muted group-hover:text-(--gold) transition-colors" />
                </a>
              )
            })}
            {collectionSlugs.map((slug) => {
              const name = collections.find((c) => c.slug === slug)?.name ?? slug
              const remaining = collectionSlugs.filter((s) => s !== slug)
              return (
                <a
                  key={`col-${slug}`}
                  href={buildUrl({
                    q: currentQ || undefined,
                    cat: categorySlugs.length > 0 ? categorySlugs : undefined,
                    brand: brandSlugs.length > 0 ? brandSlugs : undefined,
                    collection: remaining.length > 0 ? remaining : undefined,
                  })}
                  className="group flex items-center gap-1.5 px-2.5 py-1 bg-(--sub) border border-(--bd) hover:border-(--gold) transition-colors"
                >
                  <span className="text-[11px] text-muted">Col:</span>
                  <span className="text-[11px] text-text font-semibold">{name}</span>
                  <X size={10} className="text-muted group-hover:text-(--gold) transition-colors" />
                </a>
              )
            })}
          </div>
        )}
      </div>

      <ProductsClient
        initialProducts={serializedProducts}
        categories={categories}
        brands={brands}
        collections={collections}
        total={total}
      />

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex gap-2 justify-end mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={buildUrl({
                q: currentQ || undefined,
                cat: categorySlugs.length > 0 ? categorySlugs : undefined,
                brand: brandSlugs.length > 0 ? brandSlugs : undefined,
                collection: collectionSlugs.length > 0 ? collectionSlugs : undefined,
                page: String(p),
              })}
              className={cn(
                'px-3 py-1.5 text-[13px] border transition-colors',
                p === page
                  ? 'bg-(--gold) border-(--gold) text-black font-bold'
                  : 'border-(--bd) text-muted hover:text-text',
              )}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
