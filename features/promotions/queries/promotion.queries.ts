import 'server-only'
import { db } from '@/shared/lib/db'
import type { PromotionRow } from '@/features/promotions/types'

export function serializePromotion(row: {
  id: string
  name: string
  description: string | null
  type: PromotionRow['type']
  active: boolean
  minAmount: unknown
  discountAmount: unknown
  discountPercent: unknown
  requiresCoupon: boolean
  startsAt: Date | null
  endsAt: Date | null
  createdAt: Date
  updatedAt: Date
  _count?: { coupons: number }
}): PromotionRow {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    type: row.type,
    active: row.active,
    minAmount: row.minAmount != null ? Number(row.minAmount) : null,
    discountAmount: row.discountAmount != null ? Number(row.discountAmount) : null,
    discountPercent: row.discountPercent != null ? Number(row.discountPercent) : null,
    requiresCoupon: row.requiresCoupon,
    couponCount: row._count?.coupons ?? 0,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function getPromotions(): Promise<PromotionRow[]> {
  const rows = await db.promotion.findMany({
    include: { _count: { select: { coupons: true } } },
    orderBy: [{ type: 'asc' }, { createdAt: 'desc' }],
  })
  return rows.map(serializePromotion)
}

export async function getActivePromotions(): Promise<PromotionRow[]> {
  const now = new Date()
  const rows = await db.promotion.findMany({
    where: {
      active: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    include: { _count: { select: { coupons: true } } },
    orderBy: { type: 'asc' },
  })
  return rows.map(serializePromotion)
}

export async function getPromotionById(id: string): Promise<PromotionRow | null> {
  const row = await db.promotion.findUnique({
    where: { id },
    include: { _count: { select: { coupons: true } } },
  })
  return row ? serializePromotion(row) : null
}
