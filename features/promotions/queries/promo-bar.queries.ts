import { db } from '@/shared/lib/db'
import { formatCurrency } from '@/shared/lib/utils'
import 'server-only'

// ---------------------------------------------------------------------------
// Items para el banner de anuncios del inicio.
// Muestra promociones automáticas activas + cupones canjeables disponibles.
// ---------------------------------------------------------------------------

export type PromoBarItem =
  | { kind: 'free_shipping'; text: string }
  | { kind: 'discount'; text: string }
  | { kind: 'coupon'; text: string; code: string }

export async function getPromoBarItems(): Promise<PromoBarItem[]> {
  const now = new Date()

  const [autoPromos, coupons] = await Promise.all([
    // Promociones automáticas (no requieren cupón)
    db.promotion.findMany({
      where: {
        active: true,
        requiresCoupon: false,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      select: {
        type: true,
        minAmount: true,
        discountAmount: true,
        discountPercent: true,
      },
      orderBy: { type: 'asc' },
    }),
    // Cupones activos canjeables con su promoción vigente
    db.coupon.findMany({
      where: {
        active: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
        promotion: {
          active: true,
          requiresCoupon: true,
          OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
        },
      },
      select: {
        code: true,
        maxUses: true,
        usedCount: true,
        promotion: {
          select: {
            type: true,
            minAmount: true,
            discountAmount: true,
            discountPercent: true,
          },
        },
      },
      take: 5,
    }),
  ])

  const items: PromoBarItem[] = []

  // Promociones automáticas
  for (const promo of autoPromos) {
    const min = promo.minAmount != null ? Number(promo.minAmount) : null
    const amt = promo.discountAmount != null ? Number(promo.discountAmount) : null
    const pct = promo.discountPercent != null ? Number(promo.discountPercent) : null

    if (promo.type === 'FREE_SHIPPING') {
      items.push({
        kind: 'free_shipping',
        text: min
          ? `Envío gratis en pedidos mayores a ${formatCurrency(min)}`
          : 'Envío gratis en todos tus pedidos',
      })
    } else if (promo.type === 'PERCENT_DISCOUNT' && pct) {
      items.push({
        kind: 'discount',
        text: min
          ? `${pct}% de descuento en pedidos mayores a ${formatCurrency(min)}`
          : `${pct}% de descuento en toda la tienda`,
      })
    } else if (promo.type === 'FIXED_DISCOUNT' && amt) {
      items.push({
        kind: 'discount',
        text: min
          ? `${formatCurrency(amt)} de descuento en pedidos mayores a ${formatCurrency(min)}`
          : `${formatCurrency(amt)} de descuento en tu pedido`,
      })
    }
  }

  // Cupones (solo los que todavía tienen canjes disponibles)
  for (const coupon of coupons) {
    if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) continue

    const p = coupon.promotion
    const min = p.minAmount != null ? Number(p.minAmount) : null
    const amt = p.discountAmount != null ? Number(p.discountAmount) : null
    const pct = p.discountPercent != null ? Number(p.discountPercent) : null

    let benefit = ''
    if (p.type === 'FREE_SHIPPING') {
      benefit = min ? `envío gratis en pedidos +${formatCurrency(min)}` : 'envío gratis'
    } else if (p.type === 'PERCENT_DISCOUNT' && pct) {
      benefit = min
        ? `${pct}% de descuento en pedidos +${formatCurrency(min)}`
        : `${pct}% de descuento`
    } else if (p.type === 'FIXED_DISCOUNT' && amt) {
      benefit = min
        ? `${formatCurrency(amt)} de descuento en pedidos +${formatCurrency(min)}`
        : `${formatCurrency(amt)} de descuento`
    }

    if (benefit) {
      items.push({ kind: 'coupon', text: benefit, code: coupon.code })
    }
  }

  return items
}
