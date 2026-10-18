import { SkCards, SkHeader } from '@/shared/components/admin/AdminPageSkeleton'
import { SkeletonRegion } from '@/shared/components/ui/Skeleton'

// ↔ banners/page.tsx: PanelHeader + grilla de BannerCard (imagen h-37.5 + datos + acciones)
export default function Loading() {
  return (
    <SkeletonRegion label="Cargando banners…" className="px-8 pt-7 pb-12">
      <SkHeader actions={1} />
      <SkCards count={6} cardClassName="h-[318px]" />
    </SkeletonRegion>
  )
}
