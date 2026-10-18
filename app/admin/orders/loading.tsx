import { AdminPageSkeleton } from '@/shared/components/admin/AdminPageSkeleton'

// ↔ orders/page.tsx: 4 KPIs + búsqueda/tabs de estado + tabla + paginación
export default function Loading() {
  return (
    <AdminPageSkeleton
      label="Cargando pedidos…"
      kpis={4}
      filters={{ tabs: 5 }}
      cols={7}
      rows={10}
      pagination
    />
  )
}
