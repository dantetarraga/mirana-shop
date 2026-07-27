'use client'

import type { OrderStatus } from '@/generated/prisma/client'
import { DELIVERY_KIND_LABELS } from '@/features/delivery/types'
import type { OrderListItem } from '@/features/orders/types'
import { AdminDrawer } from '@/shared/components/admin/AdminDrawer'
import { DrawerSection } from '@/shared/components/admin/DrawerSection'
import { Button } from '@/shared/components/ui/Button'
import { ORDER_STATUS, fmt } from '@/shared/lib/admin/admin-constants'
import { formatDate } from '@/shared/lib/utils'

// ---------------------------------------------------------------------------
// Tipo serializado exportado
// ---------------------------------------------------------------------------

export type SerializedOrder = Omit<
  OrderListItem,
  'total' | 'subtotal' | 'shippingCost' | 'discountTotal' | 'dueTotal'
> & {
  total: number
  subtotal: number
  shippingCost: number
  discountTotal: number
  dueTotal: number
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
  /** Marca (o desmarca) el saldo de una preventa parcial como cobrado */
  onBalanceChange: (orderId: string, paid: boolean) => void
  isPending: boolean
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OrderDetailDrawer({
  order,
  onClose,
  onStatusChange,
  onBalanceChange,
  isPending,
}: OrderDetailDrawerProps) {
  const hasBalance = order.dueTotal > 0
  const balancePaid = order.duePaidAt != null

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

      <DrawerSection title="Entrega">
        <div className="flex flex-col gap-2 pt-2 text-[13px]">
          <div className="flex justify-between gap-3">
            <span className="text-[12px] tracking-[1px] uppercase text-muted">Forma</span>
            <span className="text-right">
              {order.deliveryMethodName || DELIVERY_KIND_LABELS[order.deliveryKind]}
              {order.shippingCost > 0 && (
                <span className="text-muted"> · S/ {fmt(order.shippingCost)}</span>
              )}
            </span>
          </div>

          {order.deliveryLocation && (
            <div className="flex justify-between gap-3">
              <span className="text-[12px] tracking-[1px] uppercase text-muted shrink-0">
                Retiro en
              </span>
              <span className="text-right">{order.deliveryLocation}</span>
            </div>
          )}

          {order.shipping?.dni && (
            <div className="flex justify-between gap-3">
              <span className="text-[12px] tracking-[1px] uppercase text-muted">DNI</span>
              <span className="font-mono">{order.shipping.dni}</span>
            </div>
          )}

          {order.shipping?.phone && (
            <div className="flex justify-between gap-3">
              <span className="text-[12px] tracking-[1px] uppercase text-muted">Teléfono</span>
              <span className="font-mono">{order.shipping.phone}</span>
            </div>
          )}

          {order.shipping?.address && (
            <div className="flex justify-between gap-3">
              <span className="text-[12px] tracking-[1px] uppercase text-muted shrink-0">
                Dirección
              </span>
              <span className="text-right">
                {order.shipping.address}
                <span className="block text-[12px] text-muted">
                  {[order.shipping.district, order.shipping.city].filter(Boolean).join(', ')}
                </span>
                {order.shipping.reference && (
                  <span className="block text-[12px] text-muted">{order.shipping.reference}</span>
                )}
              </span>
            </div>
          )}
        </div>
      </DrawerSection>

      <DrawerSection title="Resumen">
        {(order.discountTotal > 0 || order.couponCode) && (
          <div className="flex justify-between items-baseline pt-2 gap-3">
            <span className="text-[12px] tracking-[1px] uppercase text-muted">
              Descuento
              {order.couponCode && (
                <span className="font-mono text-accent-ink normal-case"> · {order.couponCode}</span>
              )}
            </span>
            <span className="text-success font-semibold">−S/ {fmt(order.discountTotal)}</span>
          </div>
        )}

        <div className="flex justify-between items-baseline pt-2">
          <span className="text-[12px] tracking-[1px] uppercase text-muted">
            {hasBalance ? 'Pagado a cuenta' : 'Total'} ({order._count.items} artículo
            {order._count.items !== 1 ? 's' : ''})
          </span>
          <span className="font-display font-black text-[26px] text-accent-ink">
            S/ {fmt(order.total)}
          </span>
        </div>

        {/* Preventa parcial: el cliente pagó solo el adelanto. El saldo no tiene
            un Payment propio (Payment.orderId es @unique) — se cobra a mano y
            se marca acá. */}
        {hasBalance && (
          <div className="mt-4 border border-(--bd) p-3.5 flex flex-col gap-3">
            <div className="flex justify-between items-baseline">
              <span className="text-[12px] text-muted">Valor total del pedido</span>
              <span className="text-[13px]">S/ {fmt(order.subtotal)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[12px] text-muted">Saldo pendiente</span>
              <span
                className={`font-display font-extrabold text-[18px] ${
                  balancePaid ? 'text-success' : 'text-info'
                }`}
              >
                S/ {fmt(order.dueTotal)}
              </span>
            </div>

            {balancePaid ? (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="text-[12px] text-success">
                  Cobrado el {order.duePaidAt ? formatDate(order.duePaidAt) : '—'}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => onBalanceChange(order.id, false)}
                >
                  Deshacer
                </Button>
              </div>
            ) : (
              <Button
                variant="accent"
                size="sm"
                full
                disabled={isPending}
                onClick={() => onBalanceChange(order.id, true)}
              >
                Marcar saldo como cobrado
              </Button>
            )}
          </div>
        )}
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
