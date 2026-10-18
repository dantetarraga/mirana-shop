import { AdminPageSkeleton } from '@/shared/components/admin/AdminPageSkeleton'

// ↔ reviews/page.tsx: búsqueda + 3 pestañas + tabla de 6 columnas + paginación
export default function Loading() {
  return (
    <AdminPageSkeleton
      label="Cargando reseñas…"
      filters={{ tabs: 3 }}
      cols={6}
      rows={8}
      pagination
    />
  )
}
