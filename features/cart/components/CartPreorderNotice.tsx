'use client'

import type { CartItem } from '@/features/cart/stores/cart.store'
import { formatEstimatedArrival } from '@/features/cart/lib/estimated-arrival'
import { cn } from '@/shared/lib/utils'
import { CalendarClock } from 'lucide-react'

// ---------------------------------------------------------------------------
// Aviso de preventa del carrito (drawer y /carrito) + la fecha estimada que
// muestra cada línea de preventa. La fecha sale de Product.estimatedArrival,
// que ya viaja en la línea del carrito (PRODUCT_LIST_SELECT).
// ---------------------------------------------------------------------------

/** "Llegada estimada: …" de una línea de preventa. `null` si no es preventa. */
export function PreorderArrival({
  product,
  className,
}: {
  product: CartItem['product']
  className?: string
}) {
  if (product.status !== 'PREORDER') return null
  return (
    <div className={cn('text-[11px] text-muted', className)}>
      Llegada estimada:{' '}
      <span className="font-semibold text-text">
        {formatEstimatedArrival(product.estimatedArrival)}
      </span>
    </div>
  )
}

export function CartPreorderNotice({
  cart,
  className,
}: {
  cart: CartItem[]
  className?: string
}) {
  if (!cart.some((i) => i.product.status === 'PREORDER')) return null
  return (
    <div
      className={cn(
        'flex gap-3 border border-(--bd) border-l-[3px] border-l-info bg-info/8 px-4 py-3.5',
        className,
      )}
    >
      <CalendarClock size={18} className="text-info shrink-0 mt-0.5" aria-hidden />
      <div className="text-[13px] leading-snug">
        <p className="font-semibold text-text">Tienes artículos en preventa</p>
        <p className="text-muted mt-1">
          Tu pedido se entrega cuando lleguen los productos en preventa. Las fechas son estimadas
          y pueden cambiar.
        </p>
      </div>
    </div>
  )
}
