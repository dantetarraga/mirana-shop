import { AdminPageSkeleton } from '@/shared/components/admin/AdminPageSkeleton'

// ↔ complaints/page.tsx: 4 KPIs + búsqueda/tabs + tabla + paginación
export default function Loading() {
  return (
    <AdminPageSkeleton
      label="Cargando reclamos…"
      kpis={4}
      filters={{ tabs: 4 }}
      cols={6}
      rows={8}
      pagination
    />
  )
}
