'use client'

import { Skeleton } from '@/shared/components/ui/Skeleton'
import dynamic from 'next/dynamic'

// ---------------------------------------------------------------------------
// Gráficos del dashboard con carga diferida. recharts (~100 KB gz) no aporta
// nada en el HTML del servidor —ResponsiveContainer mide el contenedor en el
// navegador— así que se omite del SSR y su JS llega en un chunk aparte. El
// skeleton reserva el mismo alto que cada gráfico para que no salte el layout.
//
// Vive en un archivo 'use client' porque `ssr: false` no se permite desde un
// Server Component (DashboardView lo es).
// ---------------------------------------------------------------------------

export const Sparkline = dynamic(
  () => import('@/features/dashboard/components/charts/Sparkline').then((m) => m.Sparkline),
  { ssr: false, loading: () => <Skeleton className="h-10 w-full" /> },
)

export const RevenueAreaChart = dynamic(
  () =>
    import('@/features/dashboard/components/charts/RevenueAreaChart').then(
      (m) => m.RevenueAreaChart,
    ),
  { ssr: false, loading: () => <Skeleton className="h-65 w-full" /> },
)

export const CategoryDonut = dynamic(
  () => import('@/features/dashboard/components/charts/CategoryDonut').then((m) => m.CategoryDonut),
  { ssr: false, loading: () => <Skeleton className="h-50 w-full" /> },
)

export const OrdersBarChart = dynamic(
  () =>
    import('@/features/dashboard/components/charts/OrdersBarChart').then((m) => m.OrdersBarChart),
  { ssr: false, loading: () => <Skeleton className="h-45 w-full" /> },
)
