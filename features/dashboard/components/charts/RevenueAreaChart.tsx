'use client'

import { ChartTooltip } from '@/features/dashboard/components/charts/ChartTooltip'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface RevenueAreaChartProps {
  data: { m: string; v: number }[]
}

export function RevenueAreaChart({ data }: RevenueAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00c8ff" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#00c8ff" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,200,255,.1)" />
        <XAxis
          dataKey="m"
          tick={{
            fill: 'rgba(228,240,255,.42)',
            fontSize: 10,
            fontFamily: 'monospace',
          }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{
            fill: 'rgba(228,240,255,.42)',
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
          stroke="#00c8ff"
          strokeWidth={2.5}
          fill="url(#areaGrad)"
          dot={false}
          activeDot={{
            r: 5,
            fill: '#00c8ff',
            stroke: 'var(--surf)',
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
