'use client'

import { ChartTooltip } from '@/features/dashboard/components/charts/ChartTooltip'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface OrdersBarChartProps {
  data: { d: string; v: number }[]
}

export function OrdersBarChart({ data }: OrdersBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,200,255,.1)" vertical={false} />
        <XAxis
          dataKey="d"
          tick={{
            fill: 'rgba(228,240,255,.42)',
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
            fill: '#00c8ff',
            stroke: '#00c8ff',
            strokeWidth: 1,
          }}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
