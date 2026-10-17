import { restoreTrashItem } from './trash.actions'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  count: vi.fn().mockResolvedValue(1),
  update: vi.fn(),
  upsert: vi.fn(),
}))
vi.mock('@/shared/lib/db', () => ({ db: {
  $transaction: mocks.transaction,
  product: { count: mocks.count, update: mocks.update },
  productInventory: { upsert: mocks.upsert },
} }))
vi.mock('@/shared/lib/require-admin', () => ({ requireAdmin: vi.fn().mockResolvedValue(null) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.transaction.mockImplementation((operations: Promise<unknown>[]) => Promise.all(operations))
})

describe('restauración del inventario', () => {
  it('mantiene existencias, reservas, preventas y versión', async () => {
    const inventory = { availableStock: 8, reservedStock: 2, preorderedStock: 3, version: 7 }
    const before = { ...inventory }
    mocks.upsert.mockImplementation(async ({ update }) => Object.assign(inventory, update))
    expect((await restoreTrashItem('product', 'product')).success).toBe(true)
    expect(inventory).toEqual(before)
    expect(mocks.update).toHaveBeenCalledWith({ where: { id: 'product' }, data: { deletedAt: null } })
  })

  it('solo recrea en cero el inventario que se perdió con el borrado antiguo', async () => {
    mocks.upsert.mockImplementation(async ({ create }) => create)
    expect((await restoreTrashItem('product', 'product')).success).toBe(true)
    expect(mocks.upsert).toHaveBeenCalledWith({
      where: { productId: 'product' },
      create: { productId: 'product', availableStock: 0 },
      update: {},
    })
  })
})
