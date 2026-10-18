import { Skeleton, SkeletonRegion } from '@/shared/components/ui/Skeleton'

/** ↔ ProductReviewsSection: título + resumen (4/12) + lista (8/12). */
export function ProductReviewsSkeleton() {
  return (
    <SkeletonRegion
      as="section"
      label="Cargando opiniones…"
      className="px-4 sm:px-6 py-10 sm:py-16 border-t border-(--bd)"
    >
      <div className="max-w-360 mx-auto">
        {/* h2 clamp(28px,4vw,48px) leading-[0.95] */}
        <Skeleton className="h-[clamp(27px,3.8vw,46px)] w-48 mb-8 sm:mb-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <div className="lg:col-span-4 flex flex-col gap-8">
            <div>
              <div className="flex items-end gap-4">
                <Skeleton className="h-[clamp(58px,7.2vw,90px)] w-[clamp(110px,13vw,170px)]" />
                <div className="pb-1.5 flex flex-col gap-2">
                  <Skeleton className="h-4.5 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-2 max-w-sm">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="grid grid-cols-[2.25rem_1fr_2.5rem] items-center gap-3 h-4.5">
                    <Skeleton className="h-3 w-6" />
                    <Skeleton className="h-1.5 w-full" />
                    <Skeleton className="h-3 w-5 justify-self-end" />
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-8 border-t border-(--bd) flex flex-col gap-3">
              <Skeleton className="h-3.5 w-64 max-w-full" />
              <Skeleton className="h-10.75 w-52" />
            </div>
          </div>

          <div className="lg:col-span-8">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="py-6 border-t border-(--bd) first:border-t-0 first:pt-0">
                <Skeleton className="h-3.5 w-20 mb-3" />
                <Skeleton className="h-4 w-1/2 mb-2.5" />
                <Skeleton className="h-3.5 w-full mb-2" />
                <Skeleton className="h-3.5 w-11/12 mb-2" />
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-3 w-40 mt-4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </SkeletonRegion>
  )
}
