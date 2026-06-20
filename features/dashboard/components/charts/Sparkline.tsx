'use client'

import { Area, AreaChart } from 'recharts'

interface SparklineProps {
  data: number[]
  color?: string
  w?: number
  h?: number
}

export function Sparkline({ data, color = '#00c8ff', w = 160, h = 40 }: SparklineProps) {
  const chartData = data.map((v) => ({ v }))
  const gradId = 'spark-' + color.replace(/[^a-z0-9]/gi, '')
  return (
    <AreaChart
      width={w}
      height={h}
      data={chartData}
      margin={{ top: 3, right: 0, left: 0, bottom: 0 }}
    >
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
  )
}
