import { SkHeader } from '@/shared/components/admin/AdminPageSkeleton'
import { Skeleton, SkeletonRegion } from '@/shared/components/ui/Skeleton'

// ↔ LegalPagesClient: PanelHeader + tabs + título + editor
export default function Loading() {
  return (
    <SkeletonRegion label="Cargando páginas legales…" className="px-8 pt-7 pb-12">
      <SkHeader actions={0} />
      <div className="max-w-200 flex flex-col gap-6">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-10.5 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </SkeletonRegion>
  )
}
