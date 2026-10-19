import { ProductCardSkeleton } from '@/features/products/components/ProductCardSkeleton'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { HERO_MIN_H } from '@/shared/components/layout/PageHero'
import { cn } from '@/shared/lib/utils'

// ---------------------------------------------------------------------------
// Esqueletos del listado con filtros (CatalogBrowser) y de las cabeceras de
// /categorias y /marcas. Sin región propia: cada loading.tsx los envuelve en
// su <SkeletonRegion>.
// ---------------------------------------------------------------------------

/** ↔ CatalogBrowser: columna de filtros de 260px + contador/orden + grilla. */
export function CatalogBrowserSkeleton({ filterGroups = 5 }: { filterGroups?: number }) {
  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[260px_1fr] gap-6 lg:gap-8 lg:items-start">
      {/* CatalogFilters: en móvil es la barra plegada (px-5 py-4, título 20px) */}
      <div className="bg-surf border border-(--bd)">
        <div className="px-5 py-4 border-b border-(--bd) flex items-center justify-between">
          <div className="font-display text-[20px]">
            <Skeleton className="inline-block align-middle h-[0.8em] w-20" />
          </div>
          <Skeleton className="h-3 w-12" />
        </div>
        <div className="hidden lg:block">
          {Array.from({ length: filterGroups }, (_, i) => (
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
        <div className="grid gap-3.5 grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
          {Array.from({ length: 8 }, (_, i) => (
            <ProductCardSkeleton key={i} className={i >= 2 ? 'max-sm:hidden' : undefined} />
          ))}
        </div>
      </div>
    </div>
  )
}

/** ↔ Breadcrumbs (mb-6 sm:mb-8, línea de 11px). */
export function BreadcrumbsSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="mb-6 sm:mb-8 flex items-center gap-2 h-[25px]">
      {Array.from({ length: items }, (_, i) => (
        <Skeleton key={i} className="h-2.5 w-16" />
      ))}
    </div>
  )
}

/** ↔ PageHero: mismo alto mínimo y padding. */
export function PageHeroSkeleton({ withBadge = false }: { withBadge?: boolean }) {
  return (
    <div className={cn('border border-(--bd) mb-6 flex items-end bg-surf', HERO_MIN_H)}>
      <div className="w-full max-w-2xl p-5 sm:p-8 lg:p-10 flex flex-col gap-3">
        {withBadge && <Skeleton className="h-14 w-32 mb-1" />}
        <div className="font-display leading-[0.95] text-[clamp(36px,5vw,64px)]">
          <Skeleton className="inline-block align-middle h-[0.8em] w-[min(20rem,70%)]" />
        </div>
        <Skeleton className="h-3.5 w-[min(28rem,90%)]" />
        <Skeleton className="h-2.5 w-24 mt-2" />
      </div>
    </div>
  )
}

/** ↔ ChipRow: chips de 40px. */
export function ChipRowSkeleton({ chips = 4, className }: { chips?: number; className?: string }) {
  return (
    <div className={cn('flex gap-2 overflow-hidden', className)}>
      {Array.from({ length: chips }, (_, i) => (
        <Skeleton key={i} className="h-10 w-28 shrink-0" />
      ))}
    </div>
  )
}
