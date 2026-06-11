'use client'

import type { OrderStatus } from '@/generated/prisma/client'
import type { OrderListItem } from '@/modules/orders/repositories/order.repo'
import { AdminDrawer } from '@/shared/components/AdminDrawer'
import { DrawerSection } from '@/shared/components/DrawerSection'
import { Button } from '@/shared/components/ui/Button'
import { ORDER_STATUS, fmt } from '@/shared/lib/admin-constants'

// ---------------------------------------------------------------------------
// Tipo serializado exportado
// ---------------------------------------------------------------------------

export type SerializedOrder = Omit<OrderListItem, 'total' | 'subtotal' | 'shippingCost'> & {
  total: number
  subtotal: number
  shippingCost: number
}

// ---------------------------------------------------------------------------
// Helpers locales
// ---------------------------------------------------------------------------

const UI_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  AWAITING_PROOF: 'Esperando comprobante',
  PAID: 'Pagado',
  PREPARING: 'Preparando',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
}

const DB_TO_UI_STATUS: Record<string, string> = {
  PENDING: 'pendiente',
  AWAITING_PROOF: 'pendiente',
  PAID: 'pendiente',
  PREPARING: 'pendiente',
  SHIPPED: 'enviado',
  DELIVERED: 'entregado',
  CANCELLED: 'cancelado',
  REFUNDED: 'cancelado',
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface OrderDetailDrawerProps {
  order: SerializedOrder
  onClose: () => void
  onStatusChange: (orderId: string, status: OrderStatus) => void
  isPending: boolean
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OrderDetailDrawer({
  order,
  onClose,
  onStatusChange,
  isPending,
}: OrderDetailDrawerProps) {
  return (
    <AdminDrawer title={order.code} sub="Detalle de pedido" onClose={onClose}>
      <DrawerSection title="Cliente" divider={false}>
        <div className="font-display text-[22px] font-black uppercase">
          {order.user?.name ?? order.shipping?.fullName ?? order.guestEmail ?? 'Invitado'}
        </div>
        <div className="text-[13px] text-muted">
          {order.user?.email ?? order.guestEmail}
          {order.shipping?.city ? ` · ${order.shipping.city}` : ''}
        </div>
      </DrawerSection>

      <DrawerSection title="Resumen">
        <div className="flex justify-between items-baseline pt-2">
          <span className="text-[12px] tracking-[1px] uppercase text-muted">
            Total ({order._count.items} artículo{order._count.items !== 1 ? 's' : ''})
          </span>
          <span className="font-display font-black text-[26px] text-(--gold)">
            S/ {fmt(order.total)}
          </span>
        </div>
      </DrawerSection>

      <DrawerSection title="Cambiar estado">
        <div className="flex flex-wrap gap-2">
          {(
            [
              'PENDING',
              'AWAITING_PROOF',
              'PAID',
              'PREPARING',
              'SHIPPED',
              'DELIVERED',
              'CANCELLED',
              'REFUNDED',
            ] as OrderStatus[]
          ).map((s) => {
            const ui = DB_TO_UI_STATUS[s] ?? 'pendiente'
            const config = ORDER_STATUS[ui] ?? ORDER_STATUS.pendiente
            return (
              <Button
                key={s}
                variant="outline"
                size="sm"
                disabled={isPending || order.status === s}
                onClick={() => onStatusChange(order.id, s)}
                className={order.status === s ? config.btnCls : 'text-muted'}
              >
                {UI_STATUS_LABELS[s]}
              </Button>
            )
          })}
        </div>
      </DrawerSection>
    </AdminDrawer>
  )
}
