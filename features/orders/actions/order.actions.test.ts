import { updateOrderStatus } from './order.actions'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  release: vi.fn(),
  finalize: vi.fn(),
}))
vi.mock('server-only', () => ({}))
vi.mock('@/shared/lib/db', () => ({ db: { $transaction: mocks.transaction } }))
vi.mock('@/shared/lib/require-admin', () => ({ requireAdmin: vi.fn().mockResolvedValue(null) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }))
vi.mock('@/features/inventory/lib/stock', () => ({
  releaseReservedStock: mocks.release,
  finalizeReservedStock: mocks.finalize,
}))

let state: { status: string; paymentStatus: string; usedCount: number; couponId: string | null }
const tx = {
  order: { findUnique: vi.fn(), updateMany: vi.fn() },
  coupon: { updateMany: vi.fn() },
  payment: { updateMany: vi.fn() },
}
const currentOrder = () => ({
  id: 'order',
  status: state.status,
  couponId: state.couponId,
  items: [{ productId: 'product', quantity: 2, isPreorder: false }],
})

beforeEach(() => {
  vi.clearAllMocks()
  mocks.release.mockReset()
  mocks.finalize.mockReset()
  state = { status: 'AWAITING_PROOF', paymentStatus: 'UNPAID', usedCount: 1, couponId: 'coupon' }
  tx.order.findUnique.mockImplementation(async () => currentOrder())
  tx.order.updateMany.mockImplementation(async ({ where, data }) => {
    if (where.status !== state.status) return { count: 0 }
    state.status = data.status
    if (data.paymentStatus) state.paymentStatus = data.paymentStatus
    return { count: 1 }
  })
  tx.coupon.updateMany.mockImplementation(async ({ where, data }) => {
    if (state.usedCount <= where.usedCount.gt) return { count: 0 }
    state.usedCount -= data.usedCount.decrement
    return { count: 1 }
  })
  mocks.transaction.mockImplementation(async (run: (client: typeof tx) => Promise<unknown>) => {
    const before = { ...state }
    try {
      return await run(tx)
    } catch (error) {
      state = before
      throw error
    }
  })
})

describe('transiciones atómicas de pedidos', () => {
  it('cancela y libera stock y cupón una sola vez', async () => {
    expect((await updateOrderStatus({ orderId: 'order', status: 'CANCELLED' })).success).toBe(true)
    expect((await updateOrderStatus({ orderId: 'order', status: 'CANCELLED' })).success).toBe(true)
    expect(state.usedCount).toBe(0)
    expect(mocks.release).toHaveBeenCalledTimes(1)
    expect(tx.coupon.updateMany).toHaveBeenCalledTimes(1)
    expect(tx.order.updateMany).toHaveBeenCalledTimes(1)
  })

  it.each(['SHIPPED', 'REFUNDED'] as const)('rechaza una transición concurrente a %s', async (status) => {
    state.status = status === 'SHIPPED' ? 'REFUNDED' : 'SHIPPED'
    tx.order.findUnique.mockResolvedValueOnce({ ...currentOrder(), status: 'PREPARING' })
    const result = await updateOrderStatus({ orderId: 'order', status })
    expect(result).toMatchObject({ success: false, code: 409 })
    expect(state.status).toBe(status === 'SHIPPED' ? 'REFUNDED' : 'SHIPPED')
    expect(tx.payment.updateMany).not.toHaveBeenCalled()
    expect(tx.coupon.updateMany).not.toHaveBeenCalled()
  })

  it('no libera reservas ni cupón cuando otra cancelación ganó', async () => {
    state.status = 'CANCELLED'
    tx.order.findUnique.mockResolvedValueOnce({ ...currentOrder(), status: 'AWAITING_PROOF' })
    expect(await updateOrderStatus({ orderId: 'order', status: 'CANCELLED' }))
      .toMatchObject({ success: false, code: 409 })
    expect(mocks.release).not.toHaveBeenCalled()
    expect(state.usedCount).toBe(1)
  })

  it('revierte la transición si falla la liberación de stock', async () => {
    mocks.release.mockRejectedValueOnce(new Error('Conflicto de inventario'))
    expect((await updateOrderStatus({ orderId: 'order', status: 'CANCELLED' })).success).toBe(false)
    expect(state.status).toBe('AWAITING_PROOF')
    expect(state.usedCount).toBe(1)
    expect(tx.coupon.updateMany).not.toHaveBeenCalled()
  })

  it('el pago mantiene consumido el cupón', async () => {
    expect((await updateOrderStatus({ orderId: 'order', status: 'PAID' })).success).toBe(true)
    expect(state).toMatchObject({ status: 'PAID', paymentStatus: 'PAID', usedCount: 1 })
    expect(mocks.finalize).toHaveBeenCalledTimes(1)
    expect(tx.coupon.updateMany).not.toHaveBeenCalled()
  })

  it('no deja el contador negativo si un dato antiguo ya está en cero', async () => {
    state.usedCount = 0
    expect((await updateOrderStatus({ orderId: 'order', status: 'CANCELLED' })).success).toBe(true)
    expect(state.usedCount).toBe(0)
  })

  it('cancela pedidos sin cupón sin modificar otros canjes', async () => {
    state.couponId = null
    expect((await updateOrderStatus({ orderId: 'order', status: 'CANCELLED' })).success).toBe(true)
    expect(tx.coupon.updateMany).not.toHaveBeenCalled()
  })
})
