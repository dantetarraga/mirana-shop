import {
  BreadcrumbsSkeleton,
  CatalogBrowserSkeleton,
  ChipRowSkeleton,
  PageHeroSkeleton,
} from '@/features/products/components/CatalogBrowserSkeleton'
import { SkeletonRegion } from '@/shared/components/ui/Skeleton'

// ↔ app/(storefront)/categorias/[slug]/page.tsx: migas → hero → chips de
// subcategorías → listado (marca, precio, disponibilidad).
export default function CategoryLoading() {
  return (
    <SkeletonRegion label="Cargando categoría…" as="section" className="shell pb-20 pt-8 sm:pt-10">
      <BreadcrumbsSkeleton />
      <PageHeroSkeleton />
      <ChipRowSkeleton className="mb-8" />
      <CatalogBrowserSkeleton filterGroups={3} />
    </SkeletonRegion>
  )
}
