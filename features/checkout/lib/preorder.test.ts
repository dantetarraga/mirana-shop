import { depositUnitPrice, effectiveMode, splitPreorderTotals } from '@/features/checkout/lib/preorder'
import { describe, expect, it } from 'vitest'

const preorder = {
  price: 359,
  salePrice: 319,
  status: 'PREORDER',
  allowPartialPreorder: true,
  preorderDepositPercent: 15,
}

describe('partial preorders', () => {
  it('calculates the deposit from the effective price', () => {
    expect(depositUnitPrice(preorder)).toBe(47.85)
  })

  it('falls back to full payment when partial preorder is disabled', () => {
    expect(effectiveMode({ ...preorder, allowPartialPreorder: false }, 'PARTIAL')).toBe('FULL')
  })

  it('splits the amount paid now from the remaining balance', () => {
    expect(splitPreorderTotals([{ product: preorder, qty: 2, preorderMode: 'PARTIAL' }])).toEqual({
      subtotal: 638,
      payableNow: 95.7,
      dueTotal: 542.3,
    })
  })
})
