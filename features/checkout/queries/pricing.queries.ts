import 'server-only'
import {
  BASE_SHIPPING_COST,
  type DiscountPromoRule,
  type PricingRules,
} from '@/features/checkout/lib/pricing'
import { getActivePromotions } from '@/features/promotions/queries/promotion.queries'

/**
 * Reglas de precios vigentes según las promociones activas en la BD.
 * - FREE_SHIPPING: se toma el umbral (minAmount) más bajo entre las activas.
 * - FIXED/PERCENT_DISCOUNT: se pasan todas; computeTotals aplica la mejor.
 */
export async function getPricingRules(): Promise<PricingRules> {
  const promos = await getActivePromotions()

  const freeShipping = promos
    .filter((p) => p.type === 'FREE_SHIPPING' && p.minAmount != null)
    .sort((a, b) => (a.minAmount ?? 0) - (b.minAmount ?? 0))[0]

  const discountPromos: DiscountPromoRule[] = promos
    .filter((p) => p.type === 'FIXED_DISCOUNT' || p.type === 'PERCENT_DISCOUNT')
    .map((p) => ({
      name: p.name,
      type: p.type as DiscountPromoRule['type'],
      minAmount: p.minAmount,
      discountAmount: p.discountAmount,
      discountPercent: p.discountPercent,
    }))

  return {
    shippingCost: BASE_SHIPPING_COST,
    freeShippingThreshold: freeShipping?.minAmount ?? null,
    discountPromos,
  }
}
