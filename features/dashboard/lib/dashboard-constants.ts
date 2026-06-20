import type { OrderListItem } from '@/features/orders/types'

export const PIE_COLORS = ['#00c8ff', '#8b7cff', '#c77cff', '#3fcf7f', '#ffb84a']

export const ORDER_STATUS_CFG: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendiente', color: 'text-[#ffb84a]' },
  AWAITING_PROOF: { label: 'Esp. comprobante', color: 'text-[#ff9933]' },
  PAID: { label: 'Pagado', color: 'text-[#3fcf7f]' },
  PREPARING: { label: 'Preparando', color: 'text-[#00c8ff]' },
  SHIPPED: { label: 'Enviado', color: 'text-[#8b7cff]' },
  DELIVERED: { label: 'Entregado', color: 'text-[#3fcf7f]' },
  CANCELLED: { label: 'Cancelado', color: 'text-[#ff6644]' },
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
