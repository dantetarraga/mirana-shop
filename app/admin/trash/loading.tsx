import { SkHeader, SkTable } from '@/shared/components/admin/AdminPageSkeleton'
import { Skeleton, SkeletonRegion } from '@/shared/components/ui/Skeleton'

// ↔ trash/page.tsx: PanelHeader + párrafo + tabs por tipo + tabla
export default function Loading() {
  return (
    <SkeletonRegion label="Cargando papelera…" className="px-8 pt-7 pb-12">
      <SkHeader actions={0} />
      <div className="max-w-2xl mb-4 flex flex-col gap-2 py-1">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <div className="flex gap-1.5 flex-wrap mb-4">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-8.5 w-28" />
        ))}
      </div>
      <SkTable cols={4} rows={6} />
    </SkeletonRegion>
  )
}
