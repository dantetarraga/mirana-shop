import { Skeleton } from '@/shared/components/ui/Skeleton'

// Fallback genérico mientras carga cualquier página de /cuenta. Mismo
// contenedor que las páginas (pt-[calc(var(--nh)+48px)]) para que no salte.
export default function AccountLoading() {
  return (
    <div
      className="max-w-275 mx-auto px-4 sm:px-6 pt-[calc(var(--nh)+48px)] pb-16"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Cargando tu cuenta…</span>
      <Skeleton className="h-2.5 w-24 mb-3" />
      <Skeleton className="h-10 w-64 mb-8" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    </div>
  )
}
