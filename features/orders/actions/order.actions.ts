'use server'

import type { OrderStatus } from '@/generated/prisma/client'
import { finalizeReservedStock, releaseReservedStock } from '@/features/inventory/lib/stock'
import { ORDER_LIST_SELECT } from '@/features/orders/queries/order.queries'
import { updateOrderStatusSchema } from '@/features/orders/schemas/order.schema'
import type { OrderListItem } from '@/features/orders/types'
import { db } from '@/shared/lib/db'
import { requireAdmin } from '@/shared/lib/require-admin'
import type { ActionResult } from '@/shared/types/action-result.types'
import { revalidatePath } from 'next/cache'

// ---------------------------------------------------------------------------
// updateOrderStatus
// ---------------------------------------------------------------------------

export async function updateOrderStatus(
  rawInput: unknown,
): Promise<ActionResult<{ id: string; status: string }>> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = updateOrderStatusSchema.safeParse(rawInput)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Datos inválidos'
    return { success: false, error: firstError, code: 400 }
  }

  const { orderId, status } = parsed.data

  try {
    const options: { cancelledAt?: Date; paidAt?: Date } = {}

    if (status === 'CANCELLED') {
      options.cancelledAt = new Date()
    } else if (status === 'PAID') {
      options.paidAt = new Date()
    }

    const updated = await db.$transaction(async (tx) => {
      const current = await tx.order.findUnique({
        where: { id: orderId },
        select: {
          status: true,
          items: { select: { productId: true, quantity: true } },
        },
      })
      if (!current) {
        throw new Error('Pedido no encontrado')
      }

      const wasFinalized = current.status === 'CANCELLED' || current.status === 'REFUNDED'
      const isCancelling = (status === 'CANCELLED' || status === 'REFUNDED') && !wasFinalized
      const isAccepting = status === 'PAID' && current.status !== 'PAID'

      if (isCancelling) {
        for (const item of current.items) {
          await releaseReservedStock(tx, {
            productId: item.productId,
            quantity: item.quantity,
            orderId,
          })
        }
      }

      if (isAccepting) {
        for (const item of current.items) {
          await finalizeReservedStock(tx, {
            productId: item.productId,
            quantity: item.quantity,
            orderId,
          })
        }
      }

      return tx.order.update({
        where: { id: orderId },
        data: {
          status: status as OrderStatus,
          paymentStatus: isAccepting ? 'PAID' : undefined,
          cancelledAt: options.cancelledAt ?? undefined,
          paidAt: options.paidAt ?? undefined,
        },
        select: ORDER_LIST_SELECT,
      }) as Promise<OrderListItem>
    })

    revalidatePath('/admin/orders')
    revalidatePath('/admin/dashboard')

    return { success: true, data: { id: updated.id, status: updated.status } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al actualizar estado del pedido'
    return { success: false, error: message, code: 500 }
  }
}
