import { expirePendingOrders } from './expire-orders'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  transaction: vi.fn(),
  release: vi.fn(),
  purge: vi.fn().mockResolvedValue(0),
}))
vi.mock('server-only', () => ({}))
vi.mock('@/shared/lib/db', () => ({
  db: { order: { findMany: mocks.findMany }, $transaction: mocks.transaction },
}))
vi.mock('@/shared/lib/rate-limit', () => ({ purgeExpiredRateLimits: mocks.purge }))
vi.mock('@/features/inventory/lib/stock', () => ({ releaseReservedStock: mocks.release }))

const now = new Date('2026-10-17T15:00:00Z')
const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * 60_000)
type ExpiryFilter = {
  status: string | { in: string[] }
  paymentStatus: string
  OR: { reservationExpiresAt: null | { lte: Date }; createdAt?: { lte: Date } }[]
}
let order: {
  id: string
  status: string
  paymentStatus: string
  couponId: string | null
  reservationExpiresAt: Date | null
  createdAt: Date
  items: { productId: string; quantity: number; isPreorder: boolean }[]
}
let usedCount: number
const tx = {
  order: { findFirst: vi.fn(), updateMany: vi.fn() },
  coupon: { updateMany: vi.fn() },
}

function matches(where: ExpiryFilter) {
  const validStatus = typeof where.status === 'string'
    ? order.status === where.status
    : where.status.in.includes(order.status)
  return validStatus && order.paymentStatus === where.paymentStatus && where.OR.some((condition) =>
    condition.reservationExpiresAt === null
      ? order.reservationExpiresAt === null && order.createdAt <= condition.createdAt!.lte
      : order.reservationExpiresAt !== null && order.reservationExpiresAt <= condition.reservationExpiresAt.lte,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.release.mockReset()
  vi.stubEnv('ORDER_RESERVATION_TTL_MINUTES', '60')
  usedCount = 1
  order = {
    id: 'order', status: 'AWAITING_PROOF', paymentStatus: 'UNPAID', couponId: 'coupon',
    reservationExpiresAt: minutesAgo(1), createdAt: minutesAgo(61),
    items: [{ productId: 'product', quantity: 1, isPreorder: false }],
  }
  mocks.findMany.mockImplementation(async ({ where }) => matches(where) ? [{ id: order.id }] : [])
  tx.order.findFirst.mockImplementation(async ({ where }) => matches(where) ? { ...order } : null)
  tx.order.updateMany.mockImplementation(async ({ where, data }) => {
    if (!matches(where)) return { count: 0 }
    Object.assign(order, data)
    return { count: 1 }
  })
  tx.coupon.updateMany.mockImplementation(async () => {
    usedCount--
    return { count: 1 }
  })
  mocks.transaction.mockImplementation(async (run: (client: typeof tx) => Promise<unknown>) => {
    const before = { ...order }
    const previousCount = usedCount
    try {
      return await run(tx)
    } catch (error) {
      order = before
      usedCount = previousCount
      throw error
    }
  })
})

afterEach(() => vi.unstubAllEnvs())

describe('vencimiento de reservas', () => {
  it.each([true, false])('libera stock y cupón una sola vez (legado: %s)', async (legacy) => {
    if (legacy) order.reservationExpiresAt = null
    expect(await expirePendingOrders(now)).toMatchObject({ expired: 1, failed: 0 })
    expect(order.status).toBe('CANCELLED')
    expect(usedCount).toBe(0)
    expect(await expirePendingOrders(now)).toMatchObject({ expired: 0, failed: 0 })
    expect(mocks.release).toHaveBeenCalledTimes(1)
    expect(tx.coupon.updateMany).toHaveBeenCalledTimes(1)
  })

  it.each(['PAID', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'])
    ('no vence pedidos en estado %s', async (status) => {
      order.status = status
      expect(await expirePendingOrders(now)).toMatchObject({ expired: 0 })
      expect(mocks.release).not.toHaveBeenCalled()
    })

  it('no vence pedidos pagados aunque su estado sea antiguo', async () => {
    order.paymentStatus = 'PAID'
    expect(await expirePendingOrders(now)).toMatchObject({ expired: 0 })
  })

  it('respeta el TTL configurado para pedidos sin fecha de vencimiento', async () => {
    vi.stubEnv('ORDER_RESERVATION_TTL_MINUTES', '120')
    order.reservationExpiresAt = null
    expect(await expirePendingOrders(now)).toMatchObject({ expired: 0 })
    order.createdAt = minutesAgo(120)
    expect(await expirePendingOrders(now)).toMatchObject({ expired: 1 })
  })

  it('no usa createdAt si hay una reserva explícita todavía vigente', async () => {
    order.reservationExpiresAt = minutesAgo(-1)
    expect(await expirePendingOrders(now)).toMatchObject({ expired: 0 })
  })

  it('no libera recursos si otro proceso ganó la transición', async () => {
    tx.order.updateMany.mockResolvedValueOnce({ count: 0 })
    expect(await expirePendingOrders(now)).toMatchObject({ expired: 0, failed: 1 })
    expect(mocks.release).not.toHaveBeenCalled()
    expect(tx.coupon.updateMany).not.toHaveBeenCalled()
  })

  it('revierte la cancelación si falla el stock y permite reintentar', async () => {
    mocks.release.mockRejectedValueOnce(new Error('Inventario concurrente'))
    expect(await expirePendingOrders(now)).toMatchObject({ expired: 0, failed: 1 })
    expect(order.status).toBe('AWAITING_PROOF')
    expect(usedCount).toBe(1)
    expect(await expirePendingOrders(now)).toMatchObject({ expired: 1, failed: 0 })
    expect(usedCount).toBe(0)
  })
})
