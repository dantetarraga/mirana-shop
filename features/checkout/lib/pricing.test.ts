import { computeTotals, effectivePrice, type PricingRules } from '@/features/checkout/lib/pricing'
import { describe, expect, it } from 'vitest'

const rules: PricingRules = {
  shippingCost: 15,
  freeShippingThreshold: 200,
  discountPromos: [],
  preorderDepositPercent: 50,
  deliveryMethods: [],
}

describe('checkout pricing', () => {
  it('uses a sale price only when it is lower', () => {
    expect(effectivePrice({ price: 100, salePrice: 80 })).toBe(80)
    expect(effectivePrice({ price: 100, salePrice: 120 })).toBe(100)
  })

  it('caps discounts at the subtotal and never returns a negative total', () => {
    const result = computeTotals(40, {
      ...rules,
      discountPromos: [
        { name: 'Promo', type: 'FIXED_DISCOUNT', minAmount: null, discountAmount: 100, discountPercent: null },
      ],
    })
    expect(result.discount).toBe(40)
    expect(result.total).toBe(15)
  })

  it('consumes a coupon only when it wins or provides free shipping', () => {
    const result = computeTotals(100, rules, {
      coupon: {
        code: 'ENVIO',
        name: 'Envío gratis',
        type: 'FREE_SHIPPING',
        minAmount: null,
        discountAmount: null,
        discountPercent: null,
      },
    })
    expect(result.shippingCost).toBe(0)
    expect(result.couponCode).toBe('ENVIO')
  })
})
