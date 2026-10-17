import { SkHeader } from '@/shared/components/admin/AdminPageSkeleton'
import { Skeleton, SkeletonRegion } from '@/shared/components/ui/Skeleton'
import { cn } from '@/shared/lib/utils'

// ↔ BrandsListClient: cabecera + buscador + lista ordenable (asa, logo 40px,
// nombre/slug, productos, dos switches, acciones). Mismas columnas que GRID.
const GRID = 'grid grid-cols-[minmax(260px,1fr)_100px_80px_120px_96px] items-center'

export default function Loading() {
  return (
    <SkeletonRegion label="Cargando marcas…" className="px-4 sm:px-8 pt-7 pb-12">
      <SkHeader actions={2} />
      <div className="flex flex-wrap items-center gap-2.5 mb-3">
        <Skeleton className="h-10.5 flex-1 min-w-50 max-w-85" />
        <Skeleton className="h-3 w-64" />
      </div>
      <div className="bg-card border border-(--bd) overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-170">
            <div className={cn(GRID, 'bg-surf border-b border-(--bd) h-11')}>
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className={i === 0 ? 'pl-12' : 'px-3'}>
                  <Skeleton className="h-2.5 w-16" />
                </div>
              ))}
            </div>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className={cn(GRID, 'h-15 border-b border-(--bd) last:border-b-0')}>
                <div className="flex items-center gap-2.5 pl-2.5 pr-3">
                  <Skeleton className="size-5 shrink-0" />
                  <Skeleton className="size-10 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Skeleton className="h-3.5 w-32 my-0.5" />
                    <Skeleton className="h-2.5 w-24 mt-1.5" />
                  </div>
                </div>
                <div className="px-3">
                  <Skeleton className="h-4 w-6" />
                </div>
                <div className="px-3">
                  <Skeleton className="h-5 w-9 rounded-full" />
                </div>
                <div className="px-3">
                  <Skeleton className="h-5 w-9 rounded-full" />
                </div>
                <div className="px-3 flex justify-end gap-1.5">
                  <Skeleton className="size-9" />
                  <Skeleton className="size-9" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SkeletonRegion>
  )
}
