import { SkHeader } from '@/shared/components/admin/AdminPageSkeleton'
import { Skeleton, SkeletonRegion } from '@/shared/components/ui/Skeleton'

// ↔ MediaLibraryClient: PanelHeader + filtros por carpeta + grilla de miniaturas
export default function Loading() {
  return (
    <SkeletonRegion label="Cargando imágenes…" className="px-8 pt-7 pb-12">
      <SkHeader actions={0} />
      <div className="flex gap-2 flex-wrap mb-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-24" />
        ))}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {Array.from({ length: 18 }, (_, i) => (
          <Skeleton key={i} className="aspect-square w-full" />
        ))}
      </div>
    </SkeletonRegion>
  )
}
