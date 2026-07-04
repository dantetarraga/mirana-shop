// ---------------------------------------------------------------------------
// Pricing — reglas y cálculo de totales del carrito/checkout.
//
// Este archivo es puro (sin 'server-only'): el cliente lo usa para mostrar
// totales en vivo y el servidor lo REUTILIZA en placeOrder para validar.
// Las reglas (promociones activas) siempre vienen de la BD vía
// getPricingRules() (features/checkout/queries/pricing.queries.ts).
// ---------------------------------------------------------------------------

/** Costo de envío base en PEN (si ninguna promoción lo anula) */
export const BASE_SHIPPING_COST = 15

export interface DiscountPromoRule {
  name: string
  type: 'FIXED_DISCOUNT' | 'PERCENT_DISCOUNT'
  minAmount: number | null
  discountAmount: number | null
  discountPercent: number | null
}

export interface PricingRules {
  shippingCost: number
  /** Umbral de envío gratis según promoción FREE_SHIPPING activa; null = sin promo */
  freeShippingThreshold: number | null
  discountPromos: DiscountPromoRule[]
}

export interface ComputedTotals {
  shippingFree: boolean
  shippingCost: number
  discount: number
  discountName: string | null
  total: number
}

/** Precio efectivo de un producto: oferta si existe y es menor al precio base */
export function effectivePrice(p: { price: number; salePrice: number | null }): number {
  return p.salePrice != null && p.salePrice < p.price ? p.salePrice : p.price
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Calcula envío, descuento y total a partir del subtotal y las reglas.
 * Aplica el MEJOR descuento aplicable (no se acumulan) + envío gratis si
 * corresponde.
 */
export function computeTotals(subtotal: number, rules: PricingRules): ComputedTotals {
  const shippingFree =
    rules.freeShippingThreshold != null && subtotal >= rules.freeShippingThreshold
  const shippingCost = shippingFree || subtotal === 0 ? 0 : rules.shippingCost

  let discount = 0
  let discountName: string | null = null

  for (const promo of rules.discountPromos) {
    if (promo.minAmount != null && subtotal < promo.minAmount) continue

    const value =
      promo.type === 'FIXED_DISCOUNT'
        ? (promo.discountAmount ?? 0)
        : subtotal * ((promo.discountPercent ?? 0) / 100)

    if (value > discount) {
      discount = value
      discountName = promo.name
    }
  }

  discount = round2(Math.min(discount, subtotal))
  const total = round2(Math.max(0, subtotal - discount + shippingCost))

  return { shippingFree, shippingCost, discount, discountName, total }
}
