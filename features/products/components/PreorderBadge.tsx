import { Dates } from '@/shared/lib/dates'
import { Clock } from 'lucide-react'

interface PreorderBadgeProps {
  estimatedArrival: Date
  size?: 'sm' | 'md'
}

export function PreorderBadge({ estimatedArrival, size = 'sm' }: PreorderBadgeProps) {
  return (
    <span className="badge-preorder">
      <Clock size={size === 'sm' ? 10 : 12} className="shrink-0" aria-hidden />
      <span>PREVENTA · {Dates.formatCivil(estimatedArrival, 'MMM yyyy')}</span>
    </span>
  )
}
