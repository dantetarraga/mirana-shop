import 'server-only'
import type { AppliedCoupon } from '@/features/checkout/lib/pricing'
import { normalizeCouponCode, type CouponRow, type PromotionOption } from '@/features/coupons/types'
import { db } from '@/shared/lib/db'

// ---------------------------------------------------------------------------
// Cupones — códigos que desbloquean una promoción concreta en el checkout.
// ---------------------------------------------------------------------------

const PROMO_SELECT = {
  id: true,
  name: true,
  type: true,
  active: true,
  minAmount: true,
  discountAmount: true,
  discountPercent: true,
  startsAt: true,
  endsAt: true,
} as const

/** ¿La promoción está activa y dentro de su ventana de vigencia? */
function isPromotionLive(
  promo: { active: boolean; startsAt: Date | null; endsAt: Date | null },
  now: Date,
): boolean {
  if (!promo.active) return false
  if (promo.startsAt && promo.startsAt > now) return false
  if (promo.endsAt && promo.endsAt < now) return false
  return true
}

export async function getCoupons(): Promise<CouponRow[]> {
  const now = new Date()
  const rows = await db.coupon.findMany({
    include: { promotion: { select: PROMO_SELECT } },
    orderBy: { createdAt: 'desc' },
  })

  return rows.map((c) => ({
    id: c.id,
    code: c.code,
    promotionId: c.promotionId,
    promotionName: c.promotion.name,
    promotionType: c.promotion.type,
    promotionActive: isPromotionLive(c.promotion, now),
    active: c.active,
    maxUses: c.maxUses,
    usedCount: c.usedCount,
    startsAt: c.startsAt,
    endsAt: c.endsAt,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }))
}

/** Promociones disponibles para asociar a un cupón (todas, activas o no) */
export async function getPromotionOptions(): Promise<PromotionOption[]> {
  return db.promotion.findMany({
    select: { id: true, name: true, type: true, requiresCoupon: true },
    orderBy: [{ active: 'desc' }, { name: 'asc' }],
  })
}

// ---------------------------------------------------------------------------
// Canje
// ---------------------------------------------------------------------------

export interface RedeemableCoupon {
  id: string
  code: string
  /** null = canjes ilimitados */
  maxUses: number | null
  usedCount: number
  /** Beneficio que aplica computeTotals */
  rule: AppliedCoupon
}

export type CouponLookup =
  | { ok: true; coupon: RedeemableCoupon }
  | { ok: false; error: string }

/**
 * Busca un cupón canjeable AHORA: existe, está activo, dentro de su vigencia,
 * con canjes disponibles y con la promoción todavía viva.
 *
 * Los mensajes distinguen el motivo para que el checkout pueda explicárselo al
 * cliente en vez de un genérico "cupón inválido".
 */
export async function findRedeemableCoupon(rawCode: string): Promise<CouponLookup> {
  const code = normalizeCouponCode(rawCode)
  if (!code) return { ok: false, error: 'Escribe un código de cupón' }

  const row = await db.coupon.findUnique({
    where: { code },
    include: { promotion: { select: PROMO_SELECT } },
  })

  if (!row) return { ok: false, error: 'El cupón no existe' }
  if (!row.active) return { ok: false, error: 'El cupón ya no está disponible' }

  const now = new Date()
  if (row.startsAt && row.startsAt > now) return { ok: false, error: 'El cupón todavía no empieza' }
  if (row.endsAt && row.endsAt < now) return { ok: false, error: 'El cupón venció' }
  if (row.maxUses != null && row.usedCount >= row.maxUses) {
    return { ok: false, error: 'El cupón alcanzó su límite de canjes' }
  }
  if (!isPromotionLive(row.promotion, now)) {
    return { ok: false, error: 'La promoción de este cupón ya no está vigente' }
  }

  return {
    ok: true,
    coupon: {
      id: row.id,
      code: row.code,
      maxUses: row.maxUses,
      usedCount: row.usedCount,
      rule: {
        code: row.code,
        name: row.promotion.name,
        type: row.promotion.type,
        minAmount: row.promotion.minAmount != null ? Number(row.promotion.minAmount) : null,
        discountAmount:
          row.promotion.discountAmount != null ? Number(row.promotion.discountAmount) : null,
        discountPercent:
          row.promotion.discountPercent != null ? Number(row.promotion.discountPercent) : null,
      },
    },
  }
}
