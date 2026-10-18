import 'server-only'
import type { TransactionClient } from '@/generated/prisma/internal/prismaNamespace'

/** Solo después de ganar la transición a CANCELLED, dentro de la misma transacción. */
export async function releaseCouponUsage(tx: TransactionClient, couponId: string | null) {
  if (!couponId) return
  await tx.coupon.updateMany({
    where: { id: couponId, usedCount: { gt: 0 } },
    data: { usedCount: { decrement: 1 } },
  })
}
