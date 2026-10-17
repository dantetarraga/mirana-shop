import 'server-only'

import type { Prisma } from '@/generated/prisma/client'
import { releaseCouponUsage } from '@/features/coupons/lib/usage'
import { releaseReservedStock } from '@/features/inventory/lib/stock'
import { OrderStatusConflictError } from '@/features/orders/lib/order-status'
import { orderReservationTtlMinutes } from '@/features/orders/lib/reservation'
import { purgeExpiredRateLimits } from '@/shared/lib/rate-limit'
import { db } from '@/shared/lib/db'

const BATCH_SIZE = 100

/** Cancela pedidos sin comprobante y devuelve su stock reservado y el canje. */
export async function expirePendingOrders(now: Date = new Date()) {
  const legacyCutoff = new Date(now.getTime() - orderReservationTtlMinutes() * 60_000)
  const expirable: Prisma.OrderWhereInput = {
    status: { in: ['PENDING', 'AWAITING_PROOF'] },
    paymentStatus: 'UNPAID',
    OR: [
      { reservationExpiresAt: { lte: now } },
      { reservationExpiresAt: null, createdAt: { lte: legacyCutoff } },
    ],
  }
  const candidates = await db.order.findMany({
    where: expirable,
    select: { id: true },
    orderBy: { reservationExpiresAt: 'asc' },
    take: BATCH_SIZE,
  })

  let expired = 0
  let failed = 0

  for (const candidate of candidates) {
    try {
      const changed = await db.$transaction(async (tx) => {
        const order = await tx.order.findFirst({
          where: { ...expirable, id: candidate.id },
          select: {
            status: true,
            couponId: true,
            items: { select: { productId: true, quantity: true, isPreorder: true } },
          },
        })
        if (!order) return false

        // Revalida estado, pago y vencimiento antes de liberar stock y cupón.
        const changed = await tx.order.updateMany({
          where: { ...expirable, id: candidate.id, status: order.status },
          data: { status: 'CANCELLED', reservationExpiresAt: null, cancelledAt: now },
        })
        if (changed.count === 0) throw new OrderStatusConflictError()

        for (const item of order.items) {
          await releaseReservedStock(tx, {
            productId: item.productId,
            quantity: item.quantity,
            orderId: candidate.id,
            isPreorder: item.isPreorder,
            reason: 'Reserva vencida sin comprobante',
          })
        }
        await releaseCouponUsage(tx, order.couponId)
        return true
      })
      if (changed) expired++
    } catch {
      // Un conflicto concurrente se reintentará en el próximo cron.
      failed++
    }
  }

  const rateLimitBucketsPurged = await purgeExpiredRateLimits(now)
  return { expired, failed, remainingBatch: candidates.length === BATCH_SIZE, rateLimitBucketsPurged }
}
