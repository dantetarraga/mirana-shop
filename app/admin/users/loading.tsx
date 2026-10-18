import { AdminPageSkeleton } from '@/shared/components/admin/AdminPageSkeleton'

// ↔ users/page.tsx: búsqueda/tabs de segmento + tabla + paginación
export default function Loading() {
  return (
    <AdminPageSkeleton
      label="Cargando usuarios…"
      padding="panel"
      filters={{ tabs: 4 }}
      cols={5}
      rows={10}
      rowHeight="h-16.5"
      pagination
    />
  )
}
