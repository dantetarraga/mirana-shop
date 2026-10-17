import { Skeleton, SkeletonRegion } from '@/shared/components/ui/Skeleton'

// ↔ CheckoutView: max-w-275, cabecera (eyebrow 11px + h1 28/34px), pasos,
// formulario a la izquierda y resumen de 380px a la derecha.
export default function CheckoutLoading() {
  return (
    <SkeletonRegion label="Cargando checkout…" className="max-w-275 mx-auto px-4 sm:px-6 pt-9 pb-16">
      <div className="mb-8">
        <div className="text-[11px] mb-1">
          <Skeleton className="inline-block align-middle h-[1em] w-14" />
        </div>
        <Skeleton className="h-7 sm:h-8.5 w-64" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 items-start">
        <div className="flex flex-col gap-6">
          {/* Pasos */}
          <div className="flex gap-2">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-11 flex-1" />
            ))}
          </div>
          <div className="bg-surf border border-(--bd) p-5 sm:p-6 flex flex-col gap-4">
            <Skeleton className="h-5 w-40" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="h-2.5 w-20" />
                  <Skeleton className="h-11 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-surf border border-(--bd) p-6 flex flex-col gap-4">
          <Skeleton className="h-6 w-36" />
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex gap-3 items-center">
              <Skeleton className="size-14 shrink-0" />
              <Skeleton className="h-3.5 flex-1" />
            </div>
          ))}
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-8 w-full" />
          <div className="ui-btn ui-btn--lg ui-btn--full skeleton">&nbsp;</div>
        </div>
      </div>
    </SkeletonRegion>
  )
}
