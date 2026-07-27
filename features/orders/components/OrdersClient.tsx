'use client'

import { setOrderBalancePaid, updateOrderStatus } from '@/features/orders/actions/order.actions'
import {
  OrderDetailDrawer,
  type SerializedOrder,
} from '@/features/orders/components/OrderDetailDrawer'
import { ORDER_STATUS_LABELS, orderStatusGroup } from '@/features/orders/lib/order-status'
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
      // El toast nombra el estado exacto que se eligió, no el grupo: si dijera
      // "Pendiente" al marcar "Preparando" parecería que no guardó nada.
      successMsg: `Estado: ${ORDER_STATUS_LABELS[status] ?? status}`,
      // Actualización optimista del drawer — el toast sobrevive al refresh
      onSuccess: () => setDetail((d) => (d?.id === orderId ? { ...d, status } : d)),
      // router.refresh() trae los pedidos actualizados del servidor
      refresh: true,
    })
  }

  const handleBalanceChange = (orderId: string, paid: boolean) => {
    run(() => setOrderBalancePaid(orderId, paid), {
      successMsg: paid ? 'Saldo marcado como cobrado' : 'Saldo marcado como pendiente',
      onSuccess: (data) =>
        setDetail((d) => (d?.id === orderId ? { ...d, duePaidAt: data.duePaidAt } : d)),
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
      {
        header: 'Total',
        className: cls.valGold,
        // Con preventa parcial, `total` es solo el adelanto: se marca el saldo
        // abierto para que no parezca un pedido cobrado por menos de lo que vale.
        render: (o) => (
          <span className="whitespace-nowrap">
            S/ {fmt(o.total)}
            {o.dueTotal > 0 && !o.duePaidAt && (
              <span className="ml-1.5 text-[10px] text-info font-semibold">
                +S/ {fmt(o.dueTotal)} pend.
              </span>
            )}
          </span>
        ),
      },
      {
        header: 'Estado',
        render: (o) => (
          <StatusBadge
            config={ORDER_STATUS[orderStatusGroup(o.status)] ?? ORDER_STATUS.pendiente}
            variant="filled"
          />
        ),
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
          onBalanceChange={handleBalanceChange}
          isPending={isPending}
        />
      )}
    </>
  )
}
