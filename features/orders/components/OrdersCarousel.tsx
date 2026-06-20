'use client'

import type { OrderListItem } from '@/features/orders/services/order.service'
import { Button } from '@/shared/components/ui/Button'
import { formatCurrency, formatDate } from '@/shared/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useRef, useState } from 'react'

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente',
  AWAITING_PROOF: 'Esperando comprobante',
  PAID: 'Pagado',
  PREPARING: 'Preparando',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
}

const STATUS_CLS: Record<string, string> = {
  PENDING: 'badge-amber',
  AWAITING_PROOF: 'badge-amber',
  PAID: 'badge-green',
  PREPARING: 'badge-blue',
  SHIPPED: 'badge-blue',
  DELIVERED: 'badge-green',
  CANCELLED: 'badge-red',
  REFUNDED: 'badge-red',
}

export function OrdersCarousel({ orders }: { orders: OrderListItem[] }) {
  const [idx, setIdx] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const visible = orders.length <= 1 ? orders : [orders[idx], orders[(idx + 1) % orders.length]]
  const canNav = orders.length > 2

  const prev = () => setIdx((i) => (i - 1 + orders.length) % orders.length)
  const next = () => setIdx((i) => (i + 1) % orders.length)

  if (orders.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={containerRef}
        className={`grid gap-3 ${orders.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}
      >
        {visible.map((order) => (
          <Link
            key={order.id}
            href="/cuenta/pedidos"
            className="bg-surf border border-(--bd) p-4 flex flex-col gap-2.5 no-underline hover:border-(--gold)/40 transition-colors duration-150"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-display font-black text-[13px] uppercase tracking-[1.5px] text-(--gold)">
                {order.code}
              </span>
              <span className={`badge ${STATUS_CLS[order.status] ?? 'badge-amber'} text-[10px]`}>
                {STATUS_LABEL[order.status] ?? order.status}
              </span>
            </div>
            <div className="flex justify-between text-[12px] text-muted">
              <span>{formatDate(new Date(order.createdAt), "d 'de' MMM 'de' yyyy")}</span>
              <span className="font-semibold text-text">{formatCurrency(Number(order.total))}</span>
            </div>
            <p className="text-[11px] text-muted">
              {order._count.items} producto{order._count.items !== 1 ? 's' : ''}
            </p>
          </Link>
        ))}
      </div>

      {canNav && (
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted">
            {idx + 1}–{Math.min(idx + 2, orders.length)} de {orders.length} pedidos
          </p>
          <div className="flex gap-2">
            <Button variant="icon" size="sm" onClick={prev}>
              <ChevronLeft size={14} />
            </Button>
            <Button variant="icon" size="sm" onClick={next}>
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
