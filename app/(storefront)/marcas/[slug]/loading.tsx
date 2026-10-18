import {
  BreadcrumbsSkeleton,
  CatalogBrowserSkeleton,
  ChipRowSkeleton,
  PageHeroSkeleton,
} from '@/features/products/components/CatalogBrowserSkeleton'
import { SkeletonRegion } from '@/shared/components/ui/Skeleton'

// ↔ app/(storefront)/marcas/[slug]/page.tsx: migas → hero con logo → chips
// de categorías → listado (precio y disponibilidad).
export default function BrandLoading() {
  return (
    <SkeletonRegion label="Cargando marca…" as="section" className="shell pb-20 pt-8 sm:pt-10">
      <BreadcrumbsSkeleton />
      <PageHeroSkeleton withBadge />
      <ChipRowSkeleton className="mb-8" />
      <CatalogBrowserSkeleton filterGroups={2} />
    </SkeletonRegion>
  )
}
