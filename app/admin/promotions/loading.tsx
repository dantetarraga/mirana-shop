import { SkCards, SkHeader } from '@/shared/components/admin/AdminPageSkeleton'
import { SkeletonRegion } from '@/shared/components/ui/Skeleton'

// ↔ promotions/page.tsx: PanelHeader + grilla sm:2 lg:3 de PromotionCard
export default function Loading() {
  return (
    <SkeletonRegion label="Cargando promociones…" className="px-8 pt-7 pb-12">
      <SkHeader actions={1} />
      <SkCards count={6} cardClassName="h-56" />
    </SkeletonRegion>
  )
}
