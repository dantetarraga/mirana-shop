import { ProductCardSkeleton } from '@/features/products/components/ProductCardSkeleton'
import { Skeleton, SkeletonRegion } from '@/shared/components/ui/Skeleton'

// ---------------------------------------------------------------------------
// ↔ app/(storefront)/catalogo/page.tsx. Mismo `shell pb-20 pt-9`, eyebrow +
// h1, columna de filtros de 260px en desktop (en móvil es la barra plegada de
// CatalogFilters: px-5 py-4 con el título de 20px), contador de 42px + select
// y la grilla auto-fill minmax(220px) con ProductCardSkeleton.
// ---------------------------------------------------------------------------

export default function CatalogoLoading() {
  return (
    <SkeletonRegion label="Cargando catálogo…" as="section" className="shell pb-20 pt-9">
      {/* Eyebrow 10px mb-1.5 */}
      <div className="text-[10px] mb-1.5">
        <Skeleton className="inline-block align-middle h-[1em] w-24" />
      </div>
      {/* h1 clamp(36px,5vw,64px) leading 0.95 mb-6 */}
      <div className="font-display leading-[0.95] text-[clamp(36px,5vw,64px)] mb-6">
        <Skeleton className="inline-block align-middle h-[0.8em] w-[min(18rem,70%)]" />
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-[260px_1fr] gap-6 lg:gap-8 lg:items-start">
        {/* CatalogFilters */}
        <div className="bg-surf border border-(--bd)">
          <div className="px-5 py-4 border-b border-(--bd) lg:border-b flex items-center justify-between">
            <div className="font-display text-[20px]">
              <Skeleton className="inline-block align-middle h-[0.8em] w-20" />
            </div>
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="hidden lg:block">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="px-5 py-3.5 border-b border-(--bd) last:border-b-0 flex flex-col gap-3">
                <Skeleton className="h-3.5 w-28" />
                {i < 2 &&
                  Array.from({ length: 4 }, (_, j) => (
                    <div key={j} className="flex items-center gap-2.5">
                      <Skeleton className="size-4 shrink-0" />
                      <Skeleton className="h-3 flex-1 max-w-36" />
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-baseline gap-2.5 font-display text-[42px] leading-none">
              <Skeleton className="h-[0.85em] w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-10 w-44" />
          </div>
          <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
            {Array.from({ length: 8 }, (_, i) => (
              <ProductCardSkeleton key={i} className={i >= 2 ? 'max-sm:hidden' : undefined} />
            ))}
          </div>
        </div>
      </div>
    </SkeletonRegion>
  )
}
