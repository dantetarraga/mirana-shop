import 'server-only'
import type { TransactionClient } from '@/generated/prisma/internal/prismaNamespace'

// ---------------------------------------------------------------------------
// Reserva de stock para pedidos — flujo de pago manual por WhatsApp
//
// Al confirmar un pedido se reserva stock (availableStock -> reservedStock).
// Si el admin cancela el pedido, se libera (reservedStock -> availableStock).
// Si el admin acepta el pedido (comprobante validado), se finaliza la venta
// (reservedStock se descuenta sin volver a availableStock).
//
// Estos métodos reciben el `tx` de una transacción Prisma en curso (la abre
// el caller, normalmente orders) para que la reserva y la creación de la
// orden se confirmen o reviertan juntas.
// ---------------------------------------------------------------------------

export class OptimisticLockError extends Error {
  constructor() {
    super('El inventario fue modificado concurrentemente. Intenta de nuevo.')
    this.name = 'OptimisticLockError'
  }
}

export async function reserveStockForOrder(
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
}

export async function releaseReservedStock(
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
}

export async function finalizeReservedStock(
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
}
