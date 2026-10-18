import { Skeleton, SkeletonRegion } from '@/shared/components/ui/Skeleton'

// ---------------------------------------------------------------------------
// Esqueleto de /carrito. ↔ CartView: cabecera (volver 44px + h1 24/32px),
// líneas CartLineItem `full` (miniatura 80/96px, categoría 11px, nombre,
// precio, cantidad h-11 y total de línea) y resumen de 380px a la derecha.
// Las alturas fijas replican el line-height real de cada texto (1.5 por
// defecto, leading-tight en el nombre) para que no haya salto al cargar.
//
// Lo usan loading.tsx y CartView mientras CartHydrator siembra el carrito: sin
// esto el HTML del servidor pintaba "Tu carrito está vacío" y luego saltaba.
// ---------------------------------------------------------------------------

export function CartSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <SkeletonRegion label="Cargando tu carrito…" className="px-4 sm:px-6 pt-9 pb-12 max-w-360 mx-auto">
      <div className="flex items-center gap-4 mb-6 sm:mb-10 h-11 sm:h-12">
        <Skeleton className="size-6 shrink-0" />
        <Skeleton className="h-6 sm:h-7 w-56" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 items-start">
        <div className="flex flex-col gap-4">
          {Array.from({ length: lines }, (_, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row gap-4 sm:gap-5 p-4 sm:p-5 bg-surf border border-(--bd) sm:items-center"
            >
              <div className="flex gap-4 sm:gap-5 sm:flex-1 min-w-0">
                <Skeleton className="size-20 sm:size-24 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="h-[16.5px] mb-1 flex items-center">
                    <Skeleton className="h-2.5 w-28" />
                  </div>
                  <div className="h-5 sm:h-[22.5px] flex items-center">
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                  <div className="h-[22.5px] mt-0.5 flex items-center">
                    <Skeleton className="h-3.5 w-24" />
                  </div>
                  {/* Selector de cantidad: botones h-11 + borde de 1px */}
                  <div className="mt-3 h-[46px] flex items-center gap-3">
                    <Skeleton className="h-[46px] w-30" />
                    <Skeleton className="size-11" />
                  </div>
                </div>
              </div>
              {/* Total de línea: fila con borde en móvil, columna a la derecha en sm */}
              <div className="flex items-center justify-end sm:justify-center shrink-0 pt-3 sm:pt-0 border-t border-(--bd) sm:border-t-0">
                <div className="h-7.5 sm:h-[33px] flex items-center">
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Resumen — misma tarjeta, paddings y gap que CartView */}
        <div className="bg-surf border border-(--bd) p-5 sm:p-7 flex flex-col gap-5">
          <div className="h-7.5 flex items-center">
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="flex flex-col gap-3.5">
            {Array.from({ length: 2 }, (_, i) => (
              <div key={i} className="flex justify-between items-center h-[21px]">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-16" />
              </div>
            ))}
            <div className="border-t border-(--bd) pt-3.5 flex justify-between items-center h-[50.5px]">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-8 w-36" />
            </div>
          </div>
          <div className="ui-btn ui-btn--lg ui-btn--full skeleton">&nbsp;</div>
          <div className="ui-btn ui-btn--outline ui-btn--md ui-btn--full skeleton">&nbsp;</div>
        </div>
      </div>
    </SkeletonRegion>
  )
}
