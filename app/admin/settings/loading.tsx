import { SkHeader } from '@/shared/components/admin/AdminPageSkeleton'
import { Skeleton, SkeletonRegion } from '@/shared/components/ui/Skeleton'

// ↔ StoreSettingsClient: PanelHeader + columna max-w-175 de tarjetas
export default function Loading() {
  return (
    <SkeletonRegion label="Cargando configuración…" className="px-8 pt-7 pb-12">
      <SkHeader actions={0} />
      <div className="max-w-175 flex flex-col gap-6">
        <div className="bg-card border border-(--bd) p-5 flex flex-col gap-4">
          <Skeleton className="h-2.5 w-24" />
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-10.5 w-full" />
          ))}
        </div>
        <div className="bg-card border border-(--bd) p-5 flex flex-col gap-4">
          <Skeleton className="h-2.5 w-24" />
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-10.5 w-full" />
          ))}
        </div>
        <div className="bg-card border border-(--bd) p-5 flex flex-col gap-4">
          <Skeleton className="h-2.5 w-24" />
          {Array.from({ length: 2 }, (_, i) => (
            <Skeleton key={i} className="h-10.5 w-full" />
          ))}
        </div>
      </div>
    </SkeletonRegion>
  )
}
