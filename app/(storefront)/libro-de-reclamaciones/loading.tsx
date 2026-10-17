import { Skeleton, SkeletonRegion } from '@/shared/components/ui/Skeleton'

// ↔ libro-de-reclamaciones/page.tsx: max-w-180, cabecera con aviso del
// Anexo II y párrafo legal, luego las secciones del formulario.
export default function ComplaintBookLoading() {
  return (
    <SkeletonRegion label="Cargando Libro de Reclamaciones…" className="px-4 sm:px-6 pt-9 pb-16 max-w-180 mx-auto">
      <div className="mb-8">
        <Skeleton className="h-2.5 w-28 mb-2" />
        <Skeleton className="h-7 sm:h-8.5 w-72 max-w-full mb-4" />
        <Skeleton className="h-16 w-full mb-4" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/5" />
        </div>
      </div>
      <div className="flex flex-col gap-6">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="bg-card border border-(--bd) p-5 sm:p-6 flex flex-col gap-4">
            <Skeleton className="h-4 w-48" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }, (_, j) => (
                <div key={j} className="flex flex-col gap-2">
                  <Skeleton className="h-2.5 w-24" />
                  <Skeleton className="h-11 w-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SkeletonRegion>
  )
}
