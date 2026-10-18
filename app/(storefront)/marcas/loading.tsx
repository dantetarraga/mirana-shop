import { BreadcrumbsSkeleton } from '@/features/products/components/CatalogBrowserSkeleton'
import { Skeleton, SkeletonRegion } from '@/shared/components/ui/Skeleton'

// ↔ app/(storefront)/marcas/page.tsx: migas → h1 + intro → grilla de
// destacadas (2/4 columnas) con BrandCard (logo 22:9 + fila de nombre).
export default function BrandsLoading() {
  return (
    <SkeletonRegion label="Cargando marcas…" as="section" className="shell pb-20 pt-8 sm:pt-10">
      <BreadcrumbsSkeleton items={2} />
      <div className="font-display leading-[0.95] text-[clamp(36px,5vw,64px)]">
        <Skeleton className="inline-block align-middle h-[0.8em] w-48" />
      </div>
      <Skeleton className="mt-4 mb-10 h-3.5 w-[min(30rem,90%)]" />
      <Skeleton className="h-6 w-36 mb-5" />
      <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="border border-(--bd) bg-card">
            <Skeleton className="aspect-[22/9] w-full" />
            <div className="px-4 py-3 flex justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-5" />
            </div>
          </div>
        ))}
      </div>
    </SkeletonRegion>
  )
}
