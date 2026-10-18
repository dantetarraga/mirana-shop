import { restoreTrashItem } from './trash.actions'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  count: vi.fn().mockResolvedValue(1),
  update: vi.fn(),
  upsert: vi.fn(),
  findUnique: vi.fn(),
}))
vi.mock('@/shared/lib/db', () => ({ db: {
  $transaction: mocks.transaction,
  product: { count: mocks.count, update: mocks.update, findUnique: mocks.findUnique },
  productInventory: { upsert: mocks.upsert },
} }))
vi.mock('@/shared/lib/require-admin', () => ({ requireAdmin: vi.fn().mockResolvedValue(null) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.transaction.mockImplementation((operations: Promise<unknown>[]) => Promise.all(operations))
  mocks.findUnique.mockResolvedValue({
    category: { name: 'Figuras', deletedAt: null },
    brand: { name: 'Bandai', deletedAt: null },
  })
})

describe('restauración bloqueada por referencias en la papelera', () => {
  it('no restaura un producto cuya categoría está en la papelera y la nombra', async () => {
    mocks.findUnique.mockResolvedValue({
      category: { name: 'Figuras', deletedAt: new Date() },
      brand: { name: 'Bandai', deletedAt: null },
    })
    const result = await restoreTrashItem('product', 'product')
    expect(result).toMatchObject({ success: false, code: 422 })
    expect(!result.success && result.error).toMatch(/categoría "Figuras"/)
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('nombra categoría y marca si ambas están en la papelera', async () => {
    mocks.findUnique.mockResolvedValue({
      category: { name: 'Figuras', deletedAt: new Date() },
      brand: { name: 'Bandai', deletedAt: new Date() },
    })
    const result = await restoreTrashItem('product', 'product')
    expect(!result.success && result.error).toMatch(/categoría "Figuras" y la marca "Bandai"/)
  })
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
