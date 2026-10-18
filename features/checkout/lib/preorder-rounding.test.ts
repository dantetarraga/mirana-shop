import { balanceUnitPrice, depositUnitPrice, splitPreorderTotals } from './preorder'
import { describe, expect, it } from 'vitest'

const preorder = {
  price: 2.01,
  salePrice: null,
  status: 'PREORDER',
  allowPartialPreorder: true,
  preorderDepositPercent: 50,
}

describe('redondeo del adelanto en céntimos', () => {
  it.each([
    [2.01, 50, 1.01],
    [0.01, 50, 0.01],
    [0.03, 50, 0.02],
    [2.01, 49, 0.98],
    [2.01, 100, 2.01],
    [319, 15, 47.85],
  ])('S/%s al %s%% cobra S/%s', (price, preorderDepositPercent, expected) => {
    expect(depositUnitPrice({ ...preorder, price, preorderDepositPercent })).toBe(expected)
  })

  it('aplica la oferta y el porcentaje global con el mismo redondeo', () => {
    expect(depositUnitPrice({ ...preorder, price: 5, salePrice: 2.01, preorderDepositPercent: null }, 50))
      .toBe(1.01)
  })

  it('conserva el total al separar adelanto y saldo por unidad', () => {
    expect(balanceUnitPrice(preorder)).toBe(1)
    expect(splitPreorderTotals([{ product: preorder, qty: 3, preorderMode: 'PARTIAL' }]))
      .toEqual({ subtotal: 6.03, payableNow: 3.03, dueTotal: 3 })
  })
})
