'use client'

import type { OrderStatus } from '@/generated/prisma/client'
import { DELIVERY_KIND_LABELS } from '@/features/delivery/types'
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_GROUPS,
  ORDER_STATUS_LABELS,
  orderStatusGroup,
} from '@/features/orders/lib/order-status'
import type { OrderListItem, OrderStatusGroup } from '@/features/orders/types'
import { AdminDrawer } from '@/shared/components/admin/AdminDrawer'
import { DrawerSection } from '@/shared/components/admin/DrawerSection'
import { Button } from '@/shared/components/ui/Button'
import { InfoTooltip } from '@/shared/components/ui/InfoTooltip'
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

      <DrawerSection
        title={
          <span className="inline-flex items-center gap-1.5">
            Cambiar estado
            <StatusGroupsTooltip />
          </span>
        }
      >
        <div className="flex flex-wrap gap-2">
          {ORDER_STATUS_FLOW.map((s) => {
            const config = ORDER_STATUS[orderStatusGroup(s)] ?? ORDER_STATUS.pendiente
            return (
              <Button
                key={s}
                variant="outline"
                size="sm"
                disabled={isPending || order.status === s}
                onClick={() => onStatusChange(order.id, s)}
                className={order.status === s ? config.btnCls : 'text-muted'}
              >
                {ORDER_STATUS_LABELS[s]}
              </Button>
            )
          })}
        </div>
      </DrawerSection>
    </AdminDrawer>
  )
}

/**
 * El admin maneja 8 estados pero el cliente solo ve 4: sin esto no había forma
 * de saber, al elegir "Preparando", que el pedido le va a seguir figurando como
 * "Pendiente". La lista se arma desde ORDER_STATUS_GROUPS, o sea desde la misma
 * agrupación que usan los filtros y el badge de la tabla.
 */
function StatusGroupsTooltip() {
  return (
    <InfoTooltip label="Ver a qué estado del cliente pertenece cada uno">
      <span className="block font-semibold mb-2">
        El cliente solo ve 4 estados. Cada opción de aquí cae en uno:
      </span>
      <span className="flex flex-col gap-1.5">
        {(Object.keys(ORDER_STATUS_GROUPS) as OrderStatusGroup[]).map((group) => (
          <span key={group} className="flex gap-2">
            <span
              className="shrink-0 w-2 h-2 mt-[6px] rounded-full"
              style={{ background: ORDER_STATUS[group]?.color }}
              aria-hidden
            />
            <span>
              <span className="font-semibold">{ORDER_STATUS[group]?.label}</span>{' '}
              <span className="text-muted">
                {ORDER_STATUS_GROUPS[group].map((s) => ORDER_STATUS_LABELS[s]).join(' · ')}
              </span>
            </span>
          </span>
        ))}
      </span>
    </InfoTooltip>
  )
}
