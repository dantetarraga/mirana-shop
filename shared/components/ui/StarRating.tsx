import { cn } from '@/shared/lib/utils'
import { Star } from 'lucide-react'

interface StarRatingProps {
  value: number
  size?: number
  className?: string
}

export function StarRating({ value, size = 13, className }: StarRatingProps) {
  const full = Math.floor(value)
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={size} strokeWidth={1.5} fill={i < full ? 'currentColor' : 'none'} />
      ))}
    </span>
  )
}
