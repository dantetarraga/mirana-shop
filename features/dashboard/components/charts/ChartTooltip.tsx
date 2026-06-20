'use client'

interface ChartTooltipProps {
  active?: boolean
  payload?: readonly unknown[]
  label?: string | number
  prefix?: string
  suffix?: string
}

export function ChartTooltip({
  active,
  payload,
  label,
  prefix = 'S/',
  suffix = 'K',
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  const value = (payload[0] as { value?: number | string })?.value
  return (
    <div className="px-3.5 py-2 bg-card-hover border border-(--gold)">
      <div className="font-display font-extrabold text-[16px] text-(--gold)">
        {prefix}
        {value}
        {suffix}
      </div>
      <div className="text-[10px] tracking-[1px] uppercase text-muted">{label}</div>
    </div>
  )
}
