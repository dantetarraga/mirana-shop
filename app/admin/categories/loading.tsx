import { SkHeader } from '@/shared/components/admin/AdminPageSkeleton'
import { Skeleton, SkeletonRegion } from '@/shared/components/ui/Skeleton'
import { cn } from '@/shared/lib/utils'

// ↔ CategoryTreeClient: cabecera + (buscador, árbol con sangría) + vista
// previa del menú a la derecha en xl. Mismas columnas que TREE_GRID.
const GRID = 'grid grid-cols-[minmax(280px,1fr)_150px_80px_80px_128px] items-center'

/** Raíz, hija, hija, raíz, hija, raíz… como un árbol real. */
const SHAPE = [0, 1, 1, 0, 1, 1, 1, 0, 0, 1]

export default function Loading() {
  return (
    <SkeletonRegion label="Cargando categorías…" className="px-4 sm:px-8 pt-7 pb-12">
      <SkHeader actions={2} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <Skeleton className="h-10.5 flex-1 min-w-50 max-w-85" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
          </div>
          <Skeleton className="h-3 w-3/4 max-w-130 my-[3px] mb-3" />
          <div className="bg-card border border-(--bd) overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-180">
                <div className={cn(GRID, 'bg-surf border-b border-(--bd) h-11 px-3 gap-3')}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Skeleton key={i} className={cn('h-2.5', i === 0 ? 'w-24 ml-8' : 'w-14')} />
                  ))}
                </div>
                {SHAPE.map((depth, i) => (
                  <div key={i} className={cn(GRID, 'h-15 border-b border-(--bd) last:border-b-0')}>
                    <div className="flex items-center gap-2 pl-2.5 pr-3">
                      <Skeleton className="size-5 shrink-0" />
                      {depth > 0 && <span className="w-7 shrink-0" />}
                      <span className="size-6 shrink-0" />
                      <Skeleton className="size-8 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Skeleton className={cn('h-3.5 my-0.5', depth ? 'w-28' : 'w-40')} />
                        <Skeleton className="h-2.5 w-20 mt-1.5" />
                      </div>
                    </div>
                    <div className="px-3">
                      <Skeleton className="h-4 w-6" />
                    </div>
                    <div className="px-3">
                      <Skeleton className="h-5 w-9 rounded-full" />
                    </div>
                    <div className="px-3">
                      {depth === 0 ? <Skeleton className="h-5 w-9 rounded-full" /> : <Skeleton className="h-0.5 w-3" />}
                    </div>
                    <div className="px-3 flex justify-end gap-1.5">
                      {Array.from({ length: depth === 0 ? 3 : 2 }, (_, j) => (
                        <Skeleton key={j} className="size-9" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Vista previa del menú */}
        <div className="bg-card border border-(--bd)">
          <div className="px-5 pt-4.5 pb-3.5 border-b border-(--bd)">
            <Skeleton className="h-2.5 w-14 my-[2.5px] mb-[8.5px]" />
            <Skeleton className="h-5 w-44 my-0.5" />
            <Skeleton className="h-3 w-52 mt-2" />
          </div>
          <div className="px-5 py-4 border-b border-(--bd) flex flex-wrap gap-1.5">
            {[64, 52, 88, 70].map((w, i) => (
              <Skeleton key={i} className="h-7" style={{ width: w }} />
            ))}
          </div>
          <div className="px-5 py-4 grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-2.5 w-14" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </SkeletonRegion>
  )
}
