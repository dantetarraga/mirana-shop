import { Skeleton, SkeletonRegion } from '@/shared/components/ui/Skeleton'

export default function ProductDetailLoading() {
  return (
    <SkeletonRegion label="Cargando producto…" className="px-4 sm:px-6 py-8 sm:py-12 max-w-360 mx-auto">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-3 mb-6 sm:mb-10">
        <Skeleton className="h-2.5 w-10" />
        <Skeleton className="h-2.5 w-2.5" />
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-2.5 w-2.5" />
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="h-2.5 w-2.5" />
        <Skeleton className="h-2.5 w-48" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
        {/* Left — image */}
        <Skeleton className="aspect-square w-full" />

        {/* Right — info */}
        <div className="flex flex-col gap-6 pt-2">
          <Skeleton className="h-2.5 w-32" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-3/4" />
          </div>
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="h-14 w-40" />
          <div className="flex flex-col gap-2.5">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/5" />
          </div>
          <div className="mt-2 flex flex-col gap-3">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-11 w-36" />
          </div>
          <Skeleton className="h-12 w-full" />
          {/* Acordeones (ProductInfoAccordions): filas min-h-14 con borde */}
          <div className="border-t border-(--bd)">
            {[40, 36, 48].map((w) => (
              <div key={w} className="flex items-center gap-3 min-h-14 border-b border-(--bd)">
                <Skeleton className="size-4.5 shrink-0" />
                <Skeleton className="h-3.5" style={{ width: `${w * 4}px` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </SkeletonRegion>
  )
}
