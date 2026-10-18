'use client'

import { useChartColor } from '@/features/dashboard/lib/use-chart-colors'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'

interface SparklineProps {
  data: number[]
  /** Color literal o nombre de custom property del tema (`--c-blue`) */
  color?: string
  w?: number
  h?: number
}

// Nota: `w` se mantiene en la interfaz por compatibilidad de props, pero el
// ancho real lo controla el contenedor padre (ResponsiveContainer) para que
// el sparkline nunca desborde la KpiCard en grids angostos (mobile).
export function Sparkline({ data, color: colorProp = '--accent-ink', h = 40 }: SparklineProps) {
  const color = useChartColor(colorProp)
  const chartData = data.map((v) => ({ v }))
  const gradId = 'spark-' + colorProp.replace(/[^a-z0-9]/gi, '')
  return (
    <ResponsiveContainer width="100%" height={h}>
      <AreaChart data={chartData} margin={{ top: 3, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradId})`}
          dot={(p: { cx?: number; cy?: number; index?: number }) =>
            p.index === data.length - 1 ? (
              <circle key="end" cx={p.cx ?? 0} cy={p.cy ?? 0} r={2.5} fill={color} />
            ) : (
              <g key={p.index} />
            )
          }
          activeDot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
