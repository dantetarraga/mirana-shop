import type { TransactionClient } from '@/generated/prisma/internal/prismaNamespace'
import {
  assertProductCanBeArchived,
  OptimisticLockError,
  reserveStockForOrder,
  setAvailableStock,
} from './stock'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const inventory = { availableStock: 5, reservedStock: 0, preorderedStock: 0, version: 3 }
const mock = {
  $queryRaw: vi.fn(),
  productInventory: { findUnique: vi.fn(), updateMany: vi.fn(), create: vi.fn() },
  inventoryMovement: { create: vi.fn() },
  orderItem: { findFirst: vi.fn() },
  preorder: { findFirst: vi.fn() },
}
const tx = mock as unknown as TransactionClient

beforeEach(() => {
  vi.resetAllMocks()
  mock.$queryRaw.mockResolvedValue([{ id: 'product' }])
  mock.productInventory.findUnique.mockResolvedValue({ ...inventory })
  mock.productInventory.updateMany.mockResolvedValue({ count: 1 })
  mock.orderItem.findFirst.mockResolvedValue(null)
  mock.preorder.findFirst.mockResolvedValue(null)
})

describe('edición de inventario', () => {
  it('versiona el cambio sin sobrescribir reservas ni preventas', async () => {
    await setAvailableStock(tx, 'product', 10)
    expect(mock.productInventory.updateMany).toHaveBeenCalledWith({
      where: { productId: 'product', version: 3 },
      data: { availableStock: 10, version: { increment: 1 } },
    })
  })

  it('aborta un ajuste cuyo inventario cambió concurrentemente', async () => {
    mock.productInventory.updateMany.mockResolvedValue({ count: 0 })
    await expect(setAvailableStock(tx, 'product', 10)).rejects.toBeInstanceOf(OptimisticLockError)
  })

  it('crea la fila solo si todavía no existe', async () => {
    mock.productInventory.findUnique.mockResolvedValue(null)
    await setAvailableStock(tx, 'product', 10)
    expect(mock.productInventory.create).toHaveBeenCalledWith({
      data: { productId: 'product', availableStock: 10 },
    })
    expect(mock.productInventory.updateMany).not.toHaveBeenCalled()
  })
})

describe('archivado y reservas', () => {
  it.each(['reservedStock', 'preorderedStock'])('bloquea el archivado con %s pendiente', async (field) => {
    mock.productInventory.findUnique.mockResolvedValue({ ...inventory, [field]: 1 })
    await expect(assertProductCanBeArchived(tx, 'product')).rejects.toThrow('No se puede archivar')
  })

  it.each(['orderItem', 'preorder'] as const)('bloquea compromisos activos de %s', async (model) => {
    mock[model].findFirst.mockResolvedValue({ id: 'active' })
    await expect(assertProductCanBeArchived(tx, 'product')).rejects.toThrow('No se puede archivar')
  })

  it('permite archivar sin compromisos pendientes', async () => {
    await expect(assertProductCanBeArchived(tx, 'product')).resolves.toBeUndefined()
  })

  it('rechaza reservas si el producto se archivó después de cargar el checkout', async () => {
    mock.$queryRaw.mockResolvedValue([])
    await expect(reserveStockForOrder(tx, { productId: 'product', orderId: 'order', quantity: 1 }))
      .rejects.toThrow('ya no está disponible')
    expect(mock.productInventory.updateMany).not.toHaveBeenCalled()
  })

  it('aborta sin movimiento si una importación cambió la versión leída', async () => {
    mock.productInventory.updateMany.mockResolvedValue({ count: 0 })
    await expect(reserveStockForOrder(tx, { productId: 'product', orderId: 'order', quantity: 1 }))
      .rejects.toBeInstanceOf(OptimisticLockError)
    expect(mock.inventoryMovement.create).not.toHaveBeenCalled()
  })
})
