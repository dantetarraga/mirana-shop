'use client'

import type { OrderListItem } from '@/modules/orders/repositories/order.repo'
import { Button } from '@/shared/components/ui/Button'
import { formatCurrency, formatDate } from '@/shared/lib/utils'
import { ChevronDown, ChevronUp, Package, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { use, useState } from 'react'

// ---------------------------------------------------------------------------
// Mapas de estado
// ---------------------------------------------------------------------------
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
}

const STATUS_CLS: Record<string, string> = {
  PENDING: 'badge-amber',
  SHIPPED: 'badge-blue',
  DELIVERED: 'badge-green',
  CANCELLED: 'badge-red',
  REFUNDED: 'badge-red',
}

const PAY_LABEL: Record<string, string> = {
  UNPAID: 'Sin pagar',
  PAID: 'Pagado',
  REFUNDED: 'Reembolsado',
}

const METHOD_LABEL: Record<string, string> = {
  WHATSAPP_TRANSFER: 'Transferencia / WhatsApp',
  CULQI_YAPE: 'Yape',
  CULQI_CARD: 'Tarjeta',
}

// ---------------------------------------------------------------------------
// Componente fila expandible
// ---------------------------------------------------------------------------
function OrderRow({ order }: { order: OrderListItem }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-card border border-(--bd) overflow-hidden">
      {/* Cabecera */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-surf/40 transition-colors"
      >
        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-x-6 gap-y-1 items-center">
          {/* Código */}
          <p className="font-display font-black text-[14px] uppercase tracking-[1.5px] text-(--gold)">
            {order.code}
          </p>

          {/* Fecha */}
          <p className="text-[12px] text-muted">
            {formatDate(new Date(order.createdAt), "d 'de' MMM 'de' yyyy")}
          </p>

          {/* Total */}
          <p className="font-semibold text-[14px]">{formatCurrency(Number(order.total))}</p>

          {/* Estado */}
          <span
            className={`badge ${STATUS_CLS[order.status] ?? 'badge-amber'} text-[11px] self-start sm:self-center`}
          >
            {STATUS_LABEL[order.status] ?? order.status}
          </span>
        </div>

        {open ? (
          <ChevronUp size={16} className="shrink-0 text-muted" />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-muted" />
        )}
      </button>

      {/* Detalle expandido */}
      {open && (
        <div className="border-t border-(--bd) px-5 py-4 flex flex-col gap-4">
          {/* Info pago */}
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-[13px]">
            <div>
              <span className="text-muted">Pago: </span>
              <span className="font-semibold">
                {PAY_LABEL[order.paymentStatus] ?? order.paymentStatus}
              </span>
            </div>
            <div>
              <span className="text-muted">Método: </span>
              <span className="font-semibold">
                {METHOD_LABEL[order.paymentMethod] ?? order.paymentMethod}
              </span>
            </div>
            {order.shipping && (
              <div>
                <span className="text-muted">Envío a: </span>
                <span className="font-semibold">
                  {order.shipping.fullName} — {order.shipping.district}, {order.shipping.city}
                </span>
              </div>
            )}
          </div>

          {/* Items */}
          <div>
            <p className="text-[10px] tracking-[2px] uppercase text-(--gold) mb-2">
              Productos ({order._count.items})
            </p>
            <p className="text-[13px] text-muted">
              {order._count.items} producto{order._count.items !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Totales */}
          <div className="border-t border-(--bd) pt-3 flex flex-col gap-1.5 text-[13px] max-w-64">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span>{formatCurrency(Number(order.subtotal))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Envío</span>
              <span>
                {Number(order.shippingCost) === 0 ? (
                  <span className="text-emerald-400 text-[12px] font-semibold uppercase">
                    Gratis
                  </span>
                ) : (
                  formatCurrency(Number(order.shippingCost))
                )}
              </span>
            </div>
            <div className="flex justify-between font-display font-black uppercase text-[15px] pt-1 border-t border-(--bd)">
              <span>Total</span>
              <span className="text-(--gold)">{formatCurrency(Number(order.total))}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Contenido
// ---------------------------------------------------------------------------
export function OrdersContent({ ordersPromise }: { ordersPromise: Promise<OrderListItem[]> }) {
  const orders = use(ordersPromise)

  return (
    <div className="max-w-275 mx-auto px-4 sm:px-6 pt-[calc(var(--nh)+48px)] pb-16">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] tracking-[3px] uppercase text-(--gold) mb-1">Cuenta</p>
        <h1 className="font-display font-black uppercase text-[28px] sm:text-[34px] tracking-tight leading-none">
          Mis Pedidos
        </h1>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-6 py-20">
          <Package size={72} strokeWidth={1} className="opacity-15" />
          <p className="text-[15px] text-muted">Aún no tienes pedidos.</p>
          <Link href="/catalogo">
            <Button variant="accent" size="md">
              <ShoppingCart size={15} className="mr-2" />
              Ver catálogo
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}
