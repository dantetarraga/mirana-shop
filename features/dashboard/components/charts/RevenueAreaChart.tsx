'use client'

import { ChartTooltip } from '@/features/dashboard/components/charts/ChartTooltip'
import { useChartColors } from '@/features/dashboard/lib/use-chart-colors'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface RevenueAreaChartProps {
  data: { m: string; v: number }[]
}

export function RevenueAreaChart({ data }: RevenueAreaChartProps) {
  // --accent-ink: cyan en oscuro, azul profundo en claro (≥3:1 para gráficos)
  const [ink, grid] = useChartColors(['--accent-ink', '--bd'] as const)
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ink} stopOpacity={0.28} />
            <stop offset="100%" stopColor={ink} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={grid} />
        <XAxis
          dataKey="m"
          tick={{
            fill: 'var(--mt)',
            fontSize: 10,
            fontFamily: 'monospace',
          }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{
            fill: 'var(--mt)',
            fontSize: 10,
            fontFamily: 'monospace',
          }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `S/${v}K`}
        />
        <Tooltip content={ChartTooltip} />
        <Area
          type="monotone"
          dataKey="v"
          stroke={ink}
          strokeWidth={2.5}
          fill="url(#areaGrad)"
          dot={false}
          activeDot={{
            r: 5,
            fill: ink,
            stroke: 'var(--surf)',
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
