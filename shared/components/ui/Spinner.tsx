import { cn } from '@/shared/lib/utils'

/**
 * Indicador de "en curso" para botones y acciones puntuales. Es un aro con un
 * cuarto en el color actual (`currentColor`), así hereda el texto del botón en
 * cualquier variante. Decorativo: el estado lo anuncia el `aria-busy` del
 * control que lo contiene.
 */
export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('animate-spin shrink-0', className)}
    >
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21.5 12A9.5 9.5 0 0 0 12 2.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
