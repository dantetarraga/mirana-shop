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
          // `isPreorder` decide si el stock a liberar/confirmar está en
          // `preorderedStock` o en `reservedStock` (ver inventory/lib/stock.ts).
          items: { select: { productId: true, quantity: true, isPreorder: true } },
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
            isPreorder: item.isPreorder,
          })
        }
      }

      if (isAccepting) {
        for (const item of current.items) {
          await finalizeReservedStock(tx, {
            productId: item.productId,
            quantity: item.quantity,
            orderId,
            isPreorder: item.isPreorder,
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

// ---------------------------------------------------------------------------
// setOrderBalancePaid — saldo de una preventa parcial
//
// El cobro del saldo es manual: el cliente transfiere y el admin lo marca acá.
// No se crea un segundo `Payment` porque `Payment.orderId` es @unique — ese
// registro representa el adelanto. El saldo vive en las columnas de Order.
// ---------------------------------------------------------------------------

export async function setOrderBalancePaid(
  orderId: string,
  paid: boolean,
): Promise<ActionResult<{ id: string; duePaidAt: Date | null }>> {
  const denied = await requireAdmin()
  if (denied) return denied

  if (!orderId) return { success: false, error: 'ID de pedido requerido', code: 400 }

  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { dueTotal: true },
    })
    if (!order) return { success: false, error: 'Pedido no encontrado', code: 404 }
    if (Number(order.dueTotal) <= 0) {
      return { success: false, error: 'Este pedido no tiene saldo pendiente', code: 400 }
    }

    const updated = await db.order.update({
      where: { id: orderId },
      data: { duePaidAt: paid ? new Date() : null },
      select: { id: true, duePaidAt: true },
    })

    revalidatePath('/admin/orders')
    revalidatePath('/admin/dashboard')
    revalidatePath('/cuenta/pedidos')

    return { success: true, data: updated }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al actualizar el saldo'
    return { success: false, error: message, code: 500 }
  }
}
