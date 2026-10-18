import { SkHeader, SkTable } from '@/shared/components/admin/AdminPageSkeleton'
import { SkeletonRegion } from '@/shared/components/ui/Skeleton'

// ↔ CouponsClient: PanelHeader (botón sm) + tabla
export default function Loading() {
  return (
    <SkeletonRegion label="Cargando cupones…" className="px-8 pt-7 pb-12">
      <SkHeader actions={1} actionSize="sm" />
      <SkTable cols={6} rows={6} />
    </SkeletonRegion>
  )
}
