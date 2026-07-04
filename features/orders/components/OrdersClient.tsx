'use client'

import { updateOrderStatus } from '@/features/orders/actions/order.actions'
import {
  OrderDetailDrawer,
  type SerializedOrder,
} from '@/features/orders/components/OrderDetailDrawer'
import type { OrderStatus } from '@/generated/prisma/client'
import { AdminTable, type Column } from '@/shared/components/admin/AdminTable'
import { StatusBadge } from '@/features/orders/components/StatusBadge'
import { useServerAction } from '@/shared/hooks/admin'
import { cls } from '@/shared/lib/admin/admin-classes'
import { ORDER_STATUS, fmt } from '@/shared/lib/admin/admin-constants'
import { cn, formatDate } from '@/shared/lib/utils'
import { ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function fmtDate(d: Date): string {
  return formatDate(d, 'd MMM')
}

// ---------------------------------------------------------------------------
// Props — solo la tabla + drawer de detalle son interactivos.
// El chrome (KPIs, búsqueda, tabs, paginación) vive en page.tsx (server).
// ---------------------------------------------------------------------------

interface OrdersClientProps {
  orders: SerializedOrder[]
}

export function OrdersClient({ orders }: OrdersClientProps) {
  const [detail, setDetail] = useState<SerializedOrder | null>(null)
  const { isPending, run } = useServerAction()

  const handleStatusChange = (orderId: string, status: OrderStatus) => {
    run(() => updateOrderStatus({ orderId, status }), {
      successMsg: `Estado: ${ORDER_STATUS[DB_TO_UI_STATUS[status]]?.label ?? status}`,
      // Actualización optimista del drawer — el toast sobrevive al refresh
      onSuccess: () => setDetail((d) => (d?.id === orderId ? { ...d, status } : d)),
      // router.refresh() trae los pedidos actualizados del servidor
      refresh: true,
    })
  }

  const columns = useMemo<Column<SerializedOrder>[]>(
    () => [
      { header: 'Pedido', className: cls.monoGold, render: (o) => o.code },
      {
        header: 'Cliente',
        render: (o) => {
          const name = o.user?.name ?? o.shipping?.fullName ?? o.guestEmail ?? 'Invitado'
          return (
            <>
              <div className={cn(cls.rowName, 'text-[14px]')}>{name}</div>
              <div className={cls.rowSub}>{o.shipping?.city ?? ''}</div>
            </>
          )
        },
      },
      { header: 'Artículos', className: cls.val, render: (o) => o._count.items },
      { header: 'Fecha', className: 'text-[13px] text-muted', render: (o) => fmtDate(o.createdAt) },
      { header: 'Total', className: cls.valGold, render: (o) => `S/ ${fmt(o.total)}` },
      {
        header: 'Estado',
        render: (o) => {
          const ui = DB_TO_UI_STATUS[o.status] ?? 'pendiente'
          return (
            <StatusBadge config={ORDER_STATUS[ui] ?? ORDER_STATUS.pendiente} variant="filled" />
          )
        },
      },
      {
        header: '',
        className: 'text-right text-muted',
        render: () => <ChevronRight size={14} className="inline-block" />,
      },
    ],
    [],
  )

  return (
    <>
      <AdminTable columns={columns} data={orders} keyExtractor={(o) => o.id} onRowClick={setDetail} />

      {/* Drawer de detalle */}
      {detail && (
        <OrderDetailDrawer
          order={detail}
          onClose={() => setDetail(null)}
          onStatusChange={handleStatusChange}
          isPending={isPending}
        />
      )}
    </>
  )
}
