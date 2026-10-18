import { CatalogBrowserSkeleton } from '@/features/products/components/CatalogBrowserSkeleton'
import { Skeleton, SkeletonRegion } from '@/shared/components/ui/Skeleton'

// ---------------------------------------------------------------------------
// ↔ app/(storefront)/catalogo/page.tsx. Mismo `shell pb-20 pt-9`, eyebrow +
// h1 y el listado con filtros (CatalogBrowserSkeleton).
// ---------------------------------------------------------------------------

export default function CatalogoLoading() {
  return (
    <SkeletonRegion label="Cargando catálogo…" as="section" className="shell pb-20 pt-9">
      {/* Eyebrow 10px mb-1.5 */}
      <div className="text-[10px] mb-1.5">
        <Skeleton className="inline-block align-middle h-[1em] w-24" />
      </div>
      {/* h1 clamp(36px,5vw,64px) leading 0.95 mb-6 */}
      <div className="font-display leading-[0.95] text-[clamp(36px,5vw,64px)] mb-6">
        <Skeleton className="inline-block align-middle h-[0.8em] w-[min(18rem,70%)]" />
      </div>

      <CatalogBrowserSkeleton />
    </SkeletonRegion>
  )
}
