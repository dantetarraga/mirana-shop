import { deleteProduct, importProducts, updateProduct } from './product.actions'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ transaction: vi.fn(), findProduct: vi.fn() }))
vi.mock('server-only', () => ({}))
vi.mock('@/shared/lib/db', () => ({
  db: { $transaction: mocks.transaction, product: { findUnique: mocks.findProduct } },
}))
vi.mock('@/shared/lib/require-admin', () => ({ requireAdmin: vi.fn().mockResolvedValue(null) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }))
vi.mock('@/features/brands/queries/brand.queries', () => ({
  getBrands: vi.fn().mockResolvedValue([{ id: 'brand', name: 'Marca', slug: 'marca' }]),
}))
vi.mock('@/features/categories/queries/category.queries', () => ({
  getCategories: vi.fn().mockResolvedValue([{ id: 'category', name: 'Figuras', slug: 'figuras' }]),
}))
vi.mock('@/features/products/queries/product.queries', () => ({ PRODUCT_DETAIL_SELECT: { id: true } }))
vi.mock('@/features/trash/lib/trashed-conflict', () => ({ findTrashedConflict: vi.fn() }))

let inventory: { availableStock: number; reservedStock: number; preorderedStock: number; version: number }
let deletedAt: Date | null
const tx = {
  product: { update: vi.fn(), delete: vi.fn() },
  productInventory: { findUnique: vi.fn(), upsert: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
  orderItem: { findFirst: vi.fn(), count: vi.fn() },
  preorder: { findFirst: vi.fn(), count: vi.fn() },
  inventoryMovement: { count: vi.fn() },
  cartItem: { deleteMany: vi.fn() },
}

beforeEach(() => {
  vi.clearAllMocks()
  inventory = { availableStock: 8, reservedStock: 0, preorderedStock: 0, version: 2 }
  deletedAt = null
  tx.product.update.mockImplementation(async ({ data }) => {
    if (data.deletedAt !== undefined) deletedAt = data.deletedAt
    return { id: 'product' }
  })
  tx.productInventory.findUnique.mockImplementation(async () => ({ ...inventory }))
  tx.productInventory.upsert.mockImplementation(async ({ update }) => {
    inventory.availableStock = typeof update.availableStock === 'number'
      ? update.availableStock
      : inventory.availableStock + update.availableStock.increment
    inventory.version += update.version?.increment ?? 0
  })
  tx.productInventory.updateMany.mockImplementation(async ({ where, data }) => {
    if (where.version !== inventory.version) return { count: 0 }
    inventory.availableStock = data.availableStock
    inventory.version += data.version.increment
    return { count: 1 }
  })
  tx.orderItem.findFirst.mockResolvedValue(null)
  tx.preorder.findFirst.mockResolvedValue(null)
  tx.orderItem.count.mockResolvedValue(1)
  tx.preorder.count.mockResolvedValue(0)
  tx.inventoryMovement.count.mockResolvedValue(0)
  mocks.findProduct.mockResolvedValue({ id: 'product', deletedAt: null, inventory: { availableStock: 10 } })
  mocks.transaction.mockImplementation(async (run: (client: typeof tx) => Promise<unknown>) => {
    const before = { ...inventory }
    const previousDeletedAt = deletedAt
    try {
      return await run(tx)
    } catch (error) {
      inventory = before
      deletedAt = previousDeletedAt
      throw error
    }
  })
})

describe('stock de productos', () => {
  it('suma la importación al stock actual y conserva la reserva concurrente', async () => {
    inventory.reservedStock = 2
    const result = await importProducts([
      { sku: 'SKU', name: 'Figura', price: 100, stock: 5, cat: 'Figuras', brand: 'Marca' },
    ])
    expect(result).toMatchObject({ success: true, data: { updated: 1, errors: [] } })
    expect(inventory).toEqual({ availableStock: 13, reservedStock: 2, preorderedStock: 0, version: 3 })
  })

  it('la edición incrementa la versión sin tocar las unidades comprometidas', async () => {
    inventory.reservedStock = 2
    expect((await updateProduct('product', { stock: 12 })).success).toBe(true)
    expect(inventory).toEqual({ availableStock: 12, reservedStock: 2, preorderedStock: 0, version: 3 })
  })
})

describe('papelera de productos', () => {
  it('conserva el inventario al archivar un producto con historial', async () => {
    const before = { ...inventory }
    expect((await deleteProduct('product')).success).toBe(true)
    expect(deletedAt).toBeInstanceOf(Date)
    expect(inventory).toEqual(before)
    expect(tx.productInventory.deleteMany).not.toHaveBeenCalled()
    expect(tx.product.delete).not.toHaveBeenCalled()
  })

  it.each(['reservedStock', 'preorderedStock'] as const)('revierte el archivado si hay %s', async (field) => {
    inventory[field] = 1
    expect(await deleteProduct('product')).toMatchObject({
      success: false, error: expect.stringContaining('reservas, preventas o pedidos activos'),
    })
    expect(deletedAt).toBeNull()
    expect(tx.cartItem.deleteMany).not.toHaveBeenCalled()
    expect(tx.productInventory.deleteMany).not.toHaveBeenCalled()
  })

  it('bloquea pedidos activos incluso cuando ya se finalizó la reserva', async () => {
    tx.orderItem.findFirst.mockResolvedValue({ id: 'paid-order-item' })
    expect((await deleteProduct('product')).success).toBe(false)
    expect(deletedAt).toBeNull()
  })

  it('aplica el mismo bloqueo al cambiar el estado a ARCHIVED', async () => {
    inventory.reservedStock = 1
    expect((await updateProduct('product', { status: 'ARCHIVED' })).success).toBe(false)
  })
})
