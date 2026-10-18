import { AdminPageSkeleton } from '@/shared/components/admin/AdminPageSkeleton'

// ↔ collections/page.tsx: búsqueda arriba + tabla con PanelHeader + paginación
export default function Loading() {
  return (
    <AdminPageSkeleton
      label="Cargando colecciones…"
      padding="panel"
      searchAbove={{}}
      header={{ actions: 2 }}
      cols={5}
      rowHeight="h-16.5"
      pagination
    />
  )
}
