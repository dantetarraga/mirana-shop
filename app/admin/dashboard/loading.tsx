import { Skeleton, SkeletonRegion } from '@/shared/components/ui/Skeleton'

// ↔ DashboardView: 4 KPIs con sparkline, área + donut, barras + top productos,
// tabla de pedidos recientes. Mismos paneles (bg-card + borde) y alturas de
// gráfico que LazyCharts (h-65 / h-50 / h-45).
export default function Loading() {
  return (
    <SkeletonRegion label="Cargando dashboard…" className="px-4 sm:px-6 lg:px-8 pt-5 lg:pt-7 pb-12">
      {/* 4 KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-(--bd) p-[20px_22px]">
            <Skeleton className="h-2.5 w-20 mb-3" />
            <Skeleton className="h-7 w-28 mb-3" />
            <Skeleton className="h-2.5 w-32 mb-4" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>

      {/* Área chart + Donut */}
      <div className="grid grid-cols-1 md:grid-cols-[1.55fr_1fr] gap-4 mb-4">
        <div className="bg-card border border-(--bd) p-[22px_24px]">
          <div className="flex justify-between items-start mb-5">
            <div>
              <Skeleton className="h-2.5 w-16 mb-2" />
              <Skeleton className="h-6 w-48" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
          <Skeleton className="w-full h-65" />
        </div>
        <div className="bg-card border border-(--bd) p-[22px_24px]">
          <div className="mb-5">
            <Skeleton className="h-2.5 w-20 mb-2" />
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="flex justify-center mb-4">
            <Skeleton className="w-45 h-45 rounded-full" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5 mb-3">
              <Skeleton className="w-2.5 h-2.5 rounded-full shrink-0" />
              <Skeleton className="h-3 flex-1" />
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>
      </div>

      {/* Barras + Top productos */}
      <div className="grid grid-cols-1 md:grid-cols-[1.55fr_1fr] gap-4 mb-4">
        <div className="bg-card border border-(--bd) p-[22px_24px]">
          <div className="flex justify-between items-start mb-5">
            <div>
              <Skeleton className="h-2.5 w-24 mb-2" />
              <Skeleton className="h-6 w-52" />
            </div>
            <Skeleton className="h-8 w-12" />
          </div>
          <Skeleton className="w-full h-45" />
        </div>
        <div className="bg-card border border-(--bd) p-[22px_24px]">
          <div className="flex justify-between items-center mb-5">
            <div>
              <Skeleton className="h-2.5 w-20 mb-2" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-3.5 w-16" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3.5 mb-4">
              <Skeleton className="w-4.5 h-5 shrink-0" />
              <Skeleton className="w-10 h-10 shrink-0" />
              <div className="flex-1 min-w-0">
                <Skeleton className="h-3.5 w-full mb-2" />
                <Skeleton className="h-1.5 w-full" />
              </div>
              <Skeleton className="w-8 h-5 shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Tabla de pedidos recientes */}
      <div className="border border-(--bd) overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-(--bd)">
          <div>
            <Skeleton className="h-2.5 w-28 mb-2" />
            <Skeleton className="h-6 w-36" />
          </div>
          <Skeleton className="h-3.5 w-20" />
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-150">
            <div className="bg-surf border-b border-(--bd) flex gap-4 px-4 py-3.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-2.5 flex-1" />
              ))}
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-4 py-4 border-b border-(--bd) last:border-b-0">
                {Array.from({ length: 6 }).map((_, j) => (
                  <Skeleton
                    key={j}
                    className="h-3.5 flex-1"
                   
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </SkeletonRegion>
  )
}
