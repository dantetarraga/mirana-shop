import { ProductCardSkeleton } from '@/features/products/components/ProductCardSkeleton'
import { Skeleton, SkeletonRegion } from '@/shared/components/ui/Skeleton'

export default function CollectionDetailLoading() {
  return (
    <SkeletonRegion label="Cargando colección…" className="px-4 sm:px-6 py-8 sm:py-12 max-w-360 mx-auto">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-3 mb-6 sm:mb-10">
        <Skeleton className="h-2.5 w-10" />
        <Skeleton className="h-2.5 w-2.5" />
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-2.5 w-2.5" />
        <Skeleton className="h-2.5 w-40" />
      </div>

      {/* Cabecera */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start mb-12 lg:mb-16">
        <Skeleton className="aspect-square w-full" />
        <div className="flex flex-col gap-6 pt-2">
          <Skeleton className="h-2.5 w-44" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-2/3" />
          </div>
          <Skeleton className="h-14 w-52" />
          <div className="flex flex-col gap-2.5">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>

      {/* Grid de productos */}
      <Skeleton className="h-7 w-72 mb-5" />
      <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
        {Array.from({ length: 4 }, (_, i) => (
          <ProductCardSkeleton key={i} className={i >= 2 ? 'max-sm:hidden' : undefined} />
        ))}
      </div>
    </SkeletonRegion>
  )
}
