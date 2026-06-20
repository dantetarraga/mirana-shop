'use server'

import type { OrderStatus } from '@/generated/prisma/client'
import { orderRepo } from '@/features/orders/services/order.service'
import { updateOrderStatusSchema } from '@/shared/lib/schemas'
import type { ActionResult } from '@/shared/types/action-result.types'
import { revalidatePath } from 'next/cache'

// ---------------------------------------------------------------------------
// updateOrderStatus
// ---------------------------------------------------------------------------

export async function updateOrderStatus(
  rawInput: unknown,
): Promise<ActionResult<{ id: string; status: string }>> {
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

    const updated = await orderRepo.updateStatus(orderId, status as OrderStatus, options)

    revalidatePath('/admin/orders')
    revalidatePath('/admin/dashboard')

    return { success: true, data: { id: updated.id, status: updated.status } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al actualizar estado del pedido'
    return { success: false, error: message, code: 500 }
  }
}
