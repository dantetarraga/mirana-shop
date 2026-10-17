import { AdminPageSkeleton } from '@/shared/components/admin/AdminPageSkeleton'

// ↔ brands/page.tsx: búsqueda arriba + BrandsTableClient (PanelHeader, 2 botones) + paginación
export default function Loading() {
  return (
    <AdminPageSkeleton
      label="Cargando marcas…"
      padding="panel"
      searchAbove={{}}
      header={{ actions: 2 }}
      cols={4}
      rowHeight="h-16.5"
      pagination
    />
  )
}
