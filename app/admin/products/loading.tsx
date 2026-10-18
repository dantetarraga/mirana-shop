import { AdminPageSkeleton } from '@/shared/components/admin/AdminPageSkeleton'

// ↔ products/page.tsx: búsqueda + filtros múltiples + tabla + paginación
export default function Loading() {
  return (
    <AdminPageSkeleton
      label="Cargando productos…"
      filters={{ tabs: 4 }}
      header={{ actions: 2 }}
      cols={7}
      rows={10}
      rowHeight="h-16.5"
      pagination
    />
  )
}
