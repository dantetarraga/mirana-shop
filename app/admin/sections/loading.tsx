import { SkHeader, SkList } from '@/shared/components/admin/AdminPageSkeleton'
import { SkeletonRegion } from '@/shared/components/ui/Skeleton'

// ↔ HomeSectionsClient: PanelHeader (botón sm) + lista max-w-200
export default function Loading() {
  return (
    <SkeletonRegion label="Cargando secciones…" className="px-8 pt-7 pb-12">
      <SkHeader actions={1} actionSize="sm" />
      <SkList count={4} itemClassName="h-20" />
    </SkeletonRegion>
  )
}
