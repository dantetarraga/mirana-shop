import { Skeleton, SkeletonRegion } from '@/shared/components/ui/Skeleton'

// ↔ CartView: cabecera (volver + h1), lista de ítems (miniatura 80/96px en
// tarjeta bg-surf p-4/p-5) y resumen de 380px a la derecha en desktop.
export default function CartLoading() {
  return (
    <SkeletonRegion label="Cargando tu carrito…" className="px-4 sm:px-6 pt-9 pb-12 max-w-360 mx-auto">
      <div className="flex items-center gap-4 mb-6 sm:mb-10 h-11">
        <Skeleton className="size-6 shrink-0" />
        <Skeleton className="h-6 sm:h-7 w-56" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 items-start">
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row gap-4 sm:gap-5 p-4 sm:p-5 bg-surf border border-(--bd) sm:items-center"
            >
              <div className="flex gap-4 sm:gap-5 sm:flex-1 min-w-0">
                <Skeleton className="size-20 sm:size-24 shrink-0" />
                <div className="flex-1 flex flex-col gap-2.5 justify-center">
                  <Skeleton className="h-2.5 w-20" />
                  <Skeleton className="h-5 w-4/5" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
              <Skeleton className="h-11 w-35.5" />
            </div>
          ))}
        </div>
        <div className="bg-surf border border-(--bd) p-6 flex flex-col gap-4">
          <Skeleton className="h-6 w-32" />
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3.5 w-16" />
            </div>
          ))}
          <Skeleton className="h-8 w-full mt-2" />
          <div className="ui-btn ui-btn--lg ui-btn--full skeleton">&nbsp;</div>
        </div>
      </div>
    </SkeletonRegion>
  )
}
