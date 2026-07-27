// ---------------------------------------------------------------------------
// Estados de pedido — equivalencia entre los 8 estados de la BD (lo que maneja
// el admin) y los 4 que ve el cliente.
//
// Fuente única: antes este mapa estaba copiado en order.queries.ts, OrdersClient
// y OrderDetailDrawer, así que agregar un estado obligaba a acordarse de los
// tres. El tooltip de "Cambiar estado" también se arma desde acá para que
// nunca describa una agrupación que ya no es la real.
// ---------------------------------------------------------------------------

import type { OrderStatusGroup } from '@/features/orders/types'
import type { OrderStatus } from '@/generated/prisma/client'

/** Qué estados de BD agrupa cada uno de los 4 estados visibles. */
export const ORDER_STATUS_GROUPS: Record<OrderStatusGroup, OrderStatus[]> = {
  pendiente: ['PENDING', 'AWAITING_PROOF', 'PAID', 'PREPARING'],
  enviado: ['SHIPPED'],
  entregado: ['DELIVERED'],
  cancelado: ['CANCELLED', 'REFUNDED'],
}

/** Etiqueta en español de cada estado de BD. */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pendiente',
  AWAITING_PROOF: 'Esperando comprobante',
  PAID: 'Pagado',
  PREPARING: 'Preparando',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
}

/** Los 8 estados en el orden en que avanza un pedido — orden de los botones. */
export const ORDER_STATUS_FLOW: OrderStatus[] = Object.values(ORDER_STATUS_GROUPS).flat()

const GROUP_BY_STATUS = Object.fromEntries(
  Object.entries(ORDER_STATUS_GROUPS).flatMap(([group, statuses]) =>
    statuses.map((s) => [s, group as OrderStatusGroup]),
  ),
) as Record<OrderStatus, OrderStatusGroup>

/** Estado visible al que pertenece un estado de BD. */
export function orderStatusGroup(status: OrderStatus | string): OrderStatusGroup {
  return GROUP_BY_STATUS[status as OrderStatus] ?? 'pendiente'
}
