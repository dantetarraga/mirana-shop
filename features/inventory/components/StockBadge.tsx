import { cn } from '@/shared/lib/utils'
import { Circle } from 'lucide-react'

export function StockBadge({ s }: { s: number }) {
  const cls = s === 0 ? 'stock-out' : s <= 8 ? 'stock-low' : 'stock-ok'
  const text = s === 0 ? 'Agotado' : s <= 8 ? `${s} · Bajo` : `${s}`
  return (
    <span
      className={cn(
        'font-display font-extrabold text-[14px] inline-flex items-center gap-1.5 px-2.5 py-[3px] border',
        cls,
      )}
    >
      <Circle size={7} strokeWidth={0} fill="currentColor" />
      {text}
    </span>
  )
}
