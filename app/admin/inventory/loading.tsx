import { AdminPageSkeleton } from '@/shared/components/admin/AdminPageSkeleton'

// ↔ inventory/page.tsx: 4 KPIs + búsqueda/tabs + tabla + paginación
export default function Loading() {
  return (
    <AdminPageSkeleton
      label="Cargando inventario…"
      kpis={4}
      filters={{ tabs: 4 }}
      cols={6}
      rows={10}
      rowHeight="h-16.5"
      pagination
    />
  )
}
