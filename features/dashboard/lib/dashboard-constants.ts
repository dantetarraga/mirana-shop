import type { OrderListItem } from '@/features/orders/types'

/**
 * Paleta de series de los gráficos, como NOMBRES de custom properties: recharts
 * escribe atributos de presentación SVG, donde `var()` no funciona, así que los
 * valores se resuelven en runtime con `useChartColors()` (sigue el tema).
 * El primero es --accent-ink, no --gold: el cyan da 1.96:1 sobre blanco.
 */
export const PIE_COLOR_VARS = ['--accent-ink', '--c-blue', '--c-violet', '--c-green', '--c-amber'] as const

export const ORDER_STATUS_CFG: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendiente', color: 'text-warning' },
  AWAITING_PROOF: { label: 'Esp. comprobante', color: 'text-warning' },
  PAID: { label: 'Pagado', color: 'text-success' },
  PREPARING: { label: 'Preparando', color: 'text-accent-ink' },
  SHIPPED: { label: 'Enviado', color: 'text-info' },
  DELIVERED: { label: 'Entregado', color: 'text-success' },
  CANCELLED: { label: 'Cancelado', color: 'text-danger' },
  REFUNDED: { label: 'Reembolsado', color: 'text-muted' },
}

const CATEGORY_STRIPE: Record<string, string> = {
  'figuras-accion': 'stripe-fig',
  lego: 'stripe-lego',
  'modelos-escala': 'stripe-veh',
  anime: 'stripe-fig',
}

export function getCategoryStripe(slug: string): string {
  return CATEGORY_STRIPE[slug] ?? 'stripe-fig'
}

// Versión serializable de OrderListItem — Decimals ya convertidos a number
export type SerializedOrder = Omit<OrderListItem, 'total' | 'subtotal' | 'shippingCost'> & {
  total: number
  subtotal: number
  shippingCost: number
}

export function orderCustomer(o: SerializedOrder): string {
  return o.shipping?.fullName ?? o.user?.name ?? o.user?.email ?? o.guestEmail ?? '—'
}
