import type { InventoryMovementType, InventoryStockType } from '@/generated/prisma/client'
import type { TransactionClient } from '@/generated/prisma/internal/prismaNamespace'
import { db } from '@/shared/lib/db'

// ---------------------------------------------------------------------------
// InventoryRepo — gestión de stock con optimistic locking
// ---------------------------------------------------------------------------

export type InventoryRow = {
  id: string
  productId: string
  availableStock: number
  reservedStock: number
  preorderedStock: number
  lowStockThreshold: number | null
  version: number
  updatedAt: Date
}

export type AdjustStockInput = {
  productId: string
  delta: number
  newStock?: number
  type: InventoryMovementType
  stockType?: InventoryStockType
  reason?: string
  createdById?: string
  orderId?: string
}

export class OptimisticLockError extends Error {
  constructor() {
    super('El inventario fue modificado concurrentemente. Intenta de nuevo.')
    this.name = 'OptimisticLockError'
  }
}

export const inventoryRepo = {
  async findByProductId(productId: string): Promise<InventoryRow | null> {
    return db.productInventory.findUnique({
      where: { productId },
      select: {
        id: true,
        productId: true,
        availableStock: true,
        reservedStock: true,
        preorderedStock: true,
        lowStockThreshold: true,
        version: true,
        updatedAt: true,
      },
    })
  },

  async findLowStock(threshold = 8): Promise<InventoryRow[]> {
    return db.productInventory.findMany({
      where: {
        availableStock: { gt: 0, lte: threshold },
        product: { deletedAt: null },
      },
      select: {
        id: true,
        productId: true,
        availableStock: true,
        reservedStock: true,
        preorderedStock: true,
        lowStockThreshold: true,
        version: true,
        updatedAt: true,
      },
    })
  },

  async findOutOfStock(): Promise<InventoryRow[]> {
    return db.productInventory.findMany({
      where: {
        availableStock: 0,
        product: { deletedAt: null },
      },
      select: {
        id: true,
        productId: true,
        availableStock: true,
        reservedStock: true,
        preorderedStock: true,
        lowStockThreshold: true,
        version: true,
        updatedAt: true,
      },
    })
  },

  /**
   * Ajusta el stock con optimistic locking via campo `version`.
   * Si el version de la BD cambió desde que leímos el registro, lanza OptimisticLockError.
   */
  async adjustStock(input: AdjustStockInput): Promise<InventoryRow> {
    const {
      productId,
      delta,
      newStock,
      type,
      stockType = 'NORMAL',
      reason,
      createdById,
      orderId,
    } = input

    return db.$transaction(async (tx) => {
      const current = await tx.productInventory.findUnique({
        where: { productId },
        select: { id: true, availableStock: true, version: true },
      })

      if (!current) {
        throw new Error(`No existe inventario para el producto ${productId}`)
      }

      const nextStock = newStock !== undefined ? newStock : current.availableStock + delta

      if (nextStock < 0) {
        throw new Error('El stock no puede ser negativo')
      }

      // Optimistic locking: el update solo afecta si version no cambió
      const updated = await tx.productInventory.updateMany({
        where: { productId, version: current.version },
        data: {
          availableStock: nextStock,
          version: { increment: 1 },
        },
      })

      if (updated.count === 0) {
        throw new OptimisticLockError()
      }

      // Registrar el movimiento de inventario
      await tx.inventoryMovement.create({
        data: {
          productId,
          orderId: orderId ?? null,
          type,
          stockType,
          quantity: newStock !== undefined ? newStock - current.availableStock : delta,
          balanceAfter: nextStock,
          reason: reason ?? null,
          createdById: createdById ?? null,
        },
      })

      const result = await tx.productInventory.findUnique({
        where: { productId },
        select: {
          id: true,
          productId: true,
          availableStock: true,
          reservedStock: true,
          preorderedStock: true,
          lowStockThreshold: true,
          version: true,
          updatedAt: true,
        },
      })

      return result!
    })
  },

  // ---------------------------------------------------------------------------
  // Reserva de stock para pedidos — flujo de pago manual por WhatsApp
  //
  // Al confirmar un pedido se reserva stock (availableStock -> reservedStock).
  // Si el admin cancela el pedido, se libera (reservedStock -> availableStock).
  // Si el admin acepta el pedido (comprobante validado), se finaliza la venta
  // (reservedStock se descuenta sin volver a availableStock).
  //
  // Estos métodos reciben el `tx` de una transacción Prisma en curso (la abre
  // el caller, normalmente orderRepo) para que la reserva y la creación de la
  // orden se confirmen o reviertan juntas.
  // ---------------------------------------------------------------------------

  async reserveStockForOrder(
    tx: TransactionClient,
    input: { productId: string; quantity: number; orderId: string; reason?: string },
  ): Promise<void> {
    const { productId, quantity, orderId, reason } = input

    const current = await tx.productInventory.findUnique({
      where: { productId },
      select: { availableStock: true, version: true },
    })
    if (!current) {
      throw new Error(`No existe inventario para el producto ${productId}`)
    }
    if (current.availableStock < quantity) {
      throw new Error('Stock insuficiente para completar el pedido')
    }

    const updated = await tx.productInventory.updateMany({
      where: { productId, version: current.version },
      data: {
        availableStock: { decrement: quantity },
        reservedStock: { increment: quantity },
        version: { increment: 1 },
      },
    })
    if (updated.count === 0) {
      throw new OptimisticLockError()
    }

    await tx.inventoryMovement.create({
      data: {
        productId,
        orderId,
        type: 'SALE',
        stockType: 'NORMAL',
        quantity: -quantity,
        balanceAfter: current.availableStock - quantity,
        reason: reason ?? 'Reserva por pedido',
      },
    })
  },

  async releaseReservedStock(
    tx: TransactionClient,
    input: { productId: string; quantity: number; orderId: string; reason?: string },
  ): Promise<void> {
    const { productId, quantity, orderId, reason } = input

    const current = await tx.productInventory.findUnique({
      where: { productId },
      select: { availableStock: true, version: true },
    })
    if (!current) return

    const updated = await tx.productInventory.updateMany({
      where: { productId, version: current.version },
      data: {
        availableStock: { increment: quantity },
        reservedStock: { decrement: quantity },
        version: { increment: 1 },
      },
    })
    if (updated.count === 0) {
      throw new OptimisticLockError()
    }

    await tx.inventoryMovement.create({
      data: {
        productId,
        orderId,
        type: 'RETURN',
        stockType: 'NORMAL',
        quantity,
        balanceAfter: current.availableStock + quantity,
        reason: reason ?? 'Pedido cancelado — stock liberado',
      },
    })
  },

  async finalizeReservedStock(
    tx: TransactionClient,
    input: { productId: string; quantity: number; orderId: string; reason?: string },
  ): Promise<void> {
    const { productId, quantity, orderId, reason } = input

    const current = await tx.productInventory.findUnique({
      where: { productId },
      select: { availableStock: true, version: true },
    })
    if (!current) return

    const updated = await tx.productInventory.updateMany({
      where: { productId, version: current.version },
      data: {
        reservedStock: { decrement: quantity },
        version: { increment: 1 },
      },
    })
    if (updated.count === 0) {
      throw new OptimisticLockError()
    }

    await tx.inventoryMovement.create({
      data: {
        productId,
        orderId,
        type: 'SALE',
        stockType: 'NORMAL',
        quantity: 0,
        balanceAfter: current.availableStock,
        reason: reason ?? 'Pedido aceptado — venta confirmada',
      },
    })
  },

  async getStats(): Promise<{
    totalUnits: number
    totalValue: number
    lowStockCount: number
    outOfStockCount: number
  }> {
    const [agg, low, out] = await Promise.all([
      db.productInventory.aggregate({
        _sum: { availableStock: true },
      }),
      db.productInventory.count({
        where: {
          availableStock: { gt: 0, lte: 8 },
          product: { deletedAt: null },
        },
      }),
      db.productInventory.count({
        where: {
          availableStock: 0,
          product: { deletedAt: null },
        },
      }),
    ])

    const valueAgg = await db.$queryRaw<{ total_value: number }[]>`
      SELECT COALESCE(SUM(pi."availableStock" * p.price), 0)::float AS total_value
      FROM "ProductInventory" pi
      JOIN "Product" p ON p.id = pi."productId"
      WHERE p."deletedAt" IS NULL
    `

    return {
      totalUnits: agg._sum.availableStock ?? 0,
      totalValue: valueAgg[0]?.total_value ?? 0,
      lowStockCount: low,
      outOfStockCount: out,
    }
  },
}
