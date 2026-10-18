import { StarRating } from '@/shared/components/ui/StarRating'
import { cn } from '@/shared/lib/utils'

/**
 * Estrellas de solo lectura con nombre accesible ("4 de 5 estrellas"). Los
 * iconos son decoración; lo que se anuncia es la etiqueta.
 */
export function ReviewStars({
  value,
  size = 14,
  className,
}: {
  value: number
  size?: number
  className?: string
}) {
  const rounded = Math.round(value)
  return (
    <span
      role="img"
      aria-label={`${rounded} de 5 estrellas`}
      className={cn('inline-flex text-accent-ink', className)}
    >
      <StarRating value={rounded} size={size} />
    </span>
  )
}
