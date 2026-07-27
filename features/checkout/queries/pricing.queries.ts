import 'server-only'
import type { DiscountPromoRule, PricingRules } from '@/features/checkout/lib/pricing'
import { getActiveDeliveryMethods } from '@/features/delivery/queries/delivery.queries'
import { getActivePromotions } from '@/features/promotions/queries/promotion.queries'
import { getStoreSettings } from '@/features/settings/queries/store-settings.queries'

/**
 * Reglas de precios vigentes según las promociones activas en la BD.
 * - FREE_SHIPPING: se toma el umbral (minAmount) más bajo entre las activas.
 * - FIXED/PERCENT_DISCOUNT: se pasan todas; computeTotals aplica la mejor.
 *
 * Las promociones marcadas como "solo con cupón" quedan fuera: no se aplican
 * solas, hace falta que el cliente escriba el código en el checkout (ahí las
 * resuelve findRedeemableCoupon).
 */
export async function getPricingRules(): Promise<PricingRules> {
  const [promos, { baseShippingCost, preorderDepositPercent }, deliveryMethods] = await Promise.all([
    getActivePromotions(),
    getStoreSettings(),
    getActiveDeliveryMethods(),
  ])

  const automatic = promos.filter((p) => !p.requiresCoupon)

  const freeShipping = automatic
    .filter((p) => p.type === 'FREE_SHIPPING' && p.minAmount != null)
    .sort((a, b) => (a.minAmount ?? 0) - (b.minAmount ?? 0))[0]

  const discountPromos: DiscountPromoRule[] = automatic
    .filter((p) => p.type === 'FIXED_DISCOUNT' || p.type === 'PERCENT_DISCOUNT')
    .map((p) => ({
      name: p.name,
      type: p.type as DiscountPromoRule['type'],
      minAmount: p.minAmount,
      discountAmount: p.discountAmount,
      discountPercent: p.discountPercent,
    }))

  return {
    // Mientras la tienda no configure formas de entrega se sigue cobrando el
    // envío base; en cuanto haya alguna, manda el costo de la preseleccionada.
    shippingCost: deliveryMethods[0]?.cost ?? baseShippingCost,
    freeShippingThreshold: freeShipping?.minAmount ?? null,
    discountPromos,
    preorderDepositPercent,
    deliveryMethods,
  }
}
