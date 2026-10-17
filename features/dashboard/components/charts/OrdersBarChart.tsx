'use client'

import { ChartTooltip } from '@/features/dashboard/components/charts/ChartTooltip'
import { useChartColors } from '@/features/dashboard/lib/use-chart-colors'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface OrdersBarChartProps {
  data: { d: string; v: number }[]
}

export function OrdersBarChart({ data }: OrdersBarChartProps) {
  // Línea/relleno activo en --accent-ink: el cyan da 1.96:1 sobre blanco
  const [ink, grid] = useChartColors(['--accent-ink', '--bd'] as const)
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
        <XAxis
          dataKey="d"
          tick={{
            fill: 'var(--mt)',
            fontSize: 9,
            fontFamily: 'monospace',
          }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide />
        <Tooltip content={(props) => <ChartTooltip {...props} prefix="" suffix=" pedidos" />} />
        <Bar
          dataKey="v"
          fill="var(--card-h)"
          radius={[2, 2, 0, 0]}
          activeBar={{
            fill: ink,
            stroke: ink,
            strokeWidth: 1,
          }}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
