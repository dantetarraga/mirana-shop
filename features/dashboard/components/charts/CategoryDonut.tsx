'use client'

import { PIE_COLOR_VARS } from '@/features/dashboard/lib/dashboard-constants'
import { useChartColors } from '@/features/dashboard/lib/use-chart-colors'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

interface CategoryDonutProps {
  data: { name: string; value: number }[]
}

export function CategoryDonut({ data }: CategoryDonutProps) {
  const colors = useChartColors(PIE_COLOR_VARS)
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v) => [`${v}%`, 'Ventas']}
          contentStyle={{
            background: 'var(--card-h)',
            border: '1px solid var(--bdh)',
            borderRadius: 0,
          }}
          labelStyle={{ color: 'var(--mt)' }}
          itemStyle={{ color: 'var(--text)' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
