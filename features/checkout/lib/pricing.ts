// ---------------------------------------------------------------------------
// Pricing — reglas y cálculo de totales del carrito/checkout.
//
// Este archivo es puro (sin 'server-only'): el cliente lo usa para mostrar
// totales en vivo y el servidor lo REUTILIZA en placeOrder para validar.
// Las reglas (promociones activas) siempre vienen de la BD vía
// getPricingRules() (features/checkout/queries/pricing.queries.ts).
// ---------------------------------------------------------------------------

import type { DeliveryMethodOption } from '@/features/delivery/types'

/** Costo de envío base en PEN (si ninguna promoción lo anula) */
export const BASE_SHIPPING_COST = 15

export type PromoBenefitType = 'FREE_SHIPPING' | 'FIXED_DISCOUNT' | 'PERCENT_DISCOUNT'

export interface DiscountPromoRule {
  name: string
  type: 'FIXED_DISCOUNT' | 'PERCENT_DISCOUNT'
  minAmount: number | null
  discountAmount: number | null
  discountPercent: number | null
}

/**
 * Cupón ya validado contra la BD, listo para aplicar. A diferencia de las
 * promociones automáticas puede ser también de envío gratis, porque el cliente
 * lo escribió a propósito.
 */
export interface AppliedCoupon {
  /** Código en mayúsculas, tal como se guarda */
  code: string
  /** Nombre de la promoción que desbloquea — es lo que se muestra en el resumen */
  name: string
  type: PromoBenefitType
  minAmount: number | null
  discountAmount: number | null
  discountPercent: number | null
}

export interface PricingRules {
  /** Costo de envío por defecto: el de la forma de entrega preseleccionada */
  shippingCost: number
  /** Umbral de envío gratis según promoción FREE_SHIPPING activa; null = sin promo */
  freeShippingThreshold: number | null
  discountPromos: DiscountPromoRule[]
  /**
   * Adelanto por defecto de la preventa parcial (%). Viaja acá porque las
   * reglas ya llegan a carrito, drawer y checkout: es donde hace falta cuando
   * el producto no define su propio porcentaje.
   */
  preorderDepositPercent: number
  /**
   * Formas de entrega activas (retiro en tienda, preventa, envío). Vacío = la
   * tienda no configuró ninguna y se cobra `shippingCost` como hasta ahora.
   */
  deliveryMethods: DeliveryMethodOption[]
}

export interface ComputeTotalsOptions {
  /** Costo de la forma de entrega elegida; si falta, se usa rules.shippingCost */
  shippingCost?: number
  /** Cupón validado en el servidor; null = ninguno aplicado */
  coupon?: AppliedCoupon | null
}

export interface ComputedTotals {
  shippingFree: boolean
  shippingCost: number
  discount: number
  discountName: string | null
  /** Código del cupón que produjo el beneficio; null si fue una promo automática */
  couponCode: string | null
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
 * Forma de entrega que el checkout preselecciona: la primera activa según el
 * orden del admin. Devuelve null si la tienda no configuró ninguna.
 */
export function defaultDeliveryMethod(
  methods: DeliveryMethodOption[],
): DeliveryMethodOption | null {
  return methods[0] ?? null
}

/** ¿El cupón llega al monto mínimo de su promoción? */
export function isCouponEligible(coupon: AppliedCoupon, subtotal: number): boolean {
  return coupon.minAmount == null || subtotal >= coupon.minAmount
}

/**
 * Calcula envío, descuento y total a partir del subtotal y las reglas.
 * Aplica el MEJOR descuento aplicable (no se acumulan) + envío gratis si
 * corresponde. El cupón compite con las promociones automáticas por el mismo
 * hueco de descuento; su envío gratis sí se suma al del resto de reglas.
 */
export function computeTotals(
  subtotal: number,
  rules: PricingRules,
  options: ComputeTotalsOptions = {},
): ComputedTotals {
  const baseShipping = options.shippingCost ?? rules.shippingCost
  const coupon = options.coupon ?? null
  const couponEligible = coupon != null && isCouponEligible(coupon, subtotal)

  const thresholdFreeShipping =
    rules.freeShippingThreshold != null && subtotal >= rules.freeShippingThreshold
  const couponFreeShipping = couponEligible && coupon.type === 'FREE_SHIPPING'

  const shippingFree = thresholdFreeShipping || couponFreeShipping
  const shippingCost = shippingFree || subtotal === 0 ? 0 : baseShipping

  let discount = 0
  let discountName: string | null = null
  let discountFromCoupon = false

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

  if (couponEligible && coupon.type !== 'FREE_SHIPPING') {
    const value =
      coupon.type === 'FIXED_DISCOUNT'
        ? (coupon.discountAmount ?? 0)
        : subtotal * ((coupon.discountPercent ?? 0) / 100)

    if (value > discount) {
      discount = value
      discountName = coupon.name
      discountFromCoupon = true
    }
  }

  discount = round2(Math.min(discount, subtotal))
  const total = round2(Math.max(0, subtotal - discount + shippingCost))

  // Solo se marca el código si el cupón realmente cambió algo: si su descuento
  // perdió contra una promo automática, el pedido no lo consume.
  const couponCode =
    coupon != null && couponEligible && (couponFreeShipping || discountFromCoupon)
      ? coupon.code
      : null

  return { shippingFree, shippingCost, discount, discountName, couponCode, total }
}
