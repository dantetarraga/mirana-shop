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
// PREVENTA: un producto PREORDER se vende sin tener unidades — por eso
// `maxPurchasable` no le pone tope. Para esos productos no se toca
// availableStock (era 0 y la validación de stock hacía fallar TODO checkout de
// preventa); se lleva la cuenta en `preorderedStock` y los movimientos se
// marcan con `stockType: 'PREORDER'` para poder distinguirlos en el historial.
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

/** Se llama después de bloquear el producto mediante su actualización en la transacción. */
export async function assertProductCanBeArchived(tx: TransactionClient, productId: string) {
  const inventory = await tx.productInventory.findUnique({
    where: { productId },
    select: { reservedStock: true, preorderedStock: true },
  })
  const activeOrder = await tx.orderItem.findFirst({
    where: {
      productId,
      order: { status: { notIn: ['DELIVERED', 'CANCELLED', 'REFUNDED'] } },
    },
    select: { id: true },
  })
  const activePreorder = await tx.preorder.findFirst({
    where: { productId, status: { in: ['PENDING', 'CONFIRMED', 'READY'] } },
    select: { id: true },
  })
  if (
    (inventory?.reservedStock ?? 0) > 0 ||
    (inventory?.preorderedStock ?? 0) > 0 ||
    activeOrder ||
    activePreorder
  ) {
    throw new Error('No se puede archivar el producto: tiene reservas, preventas o pedidos activos.')
  }
}

/** Un ajuste absoluto solo se aplica si nadie cambió el inventario leído. */
export async function setAvailableStock(tx: TransactionClient, productId: string, stock: number) {
  const current = await tx.productInventory.findUnique({
    where: { productId },
    select: { version: true },
  })
  if (!current) {
    await tx.productInventory.create({ data: { productId, availableStock: stock } })
    return
  }
  const updated = await tx.productInventory.updateMany({
    where: { productId, version: current.version },
    data: { availableStock: stock, version: { increment: 1 } },
  })
  if (updated.count === 0) throw new OptimisticLockError()
}

/** Entrada común: `isPreorder` decide qué contador se mueve. */
interface StockOp {
  productId: string
  quantity: number
  orderId: string
  isPreorder?: boolean
  reason?: string
}

export async function reserveStockForOrder(tx: TransactionClient, input: StockOp): Promise<void> {
  const { productId, quantity, orderId, isPreorder = false, reason } = input

  // Serializa la reserva con el archivado y vuelve a validar el producto,
  // aunque el checkout lo haya leído antes de que fuera enviado a la papelera.
  const products = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM Product
    WHERE id = ${productId} AND deletedAt IS NULL AND status <> 'ARCHIVED'
    FOR UPDATE
  `
  if (products.length === 0) throw new Error('El producto ya no está disponible')

  const current = await tx.productInventory.findUnique({
    where: { productId },
    select: {
      availableStock: true,
      reservedStock: true,
      preorderedStock: true,
      version: true,
    },
  })
  if (!current) {
    throw new Error(`No existe inventario para el producto ${productId}`)
  }

  if (isPreorder) {
    // Sin unidades que descontar: solo se anota cuántas se comprometieron.
    const updated = await tx.productInventory.updateMany({
      where: { productId, version: current.version },
      data: { preorderedStock: { increment: quantity }, version: { increment: 1 } },
    })
    if (updated.count === 0) throw new OptimisticLockError()

    await tx.inventoryMovement.create({
      data: {
        productId,
        orderId,
        type: 'SALE',
        stockType: 'PREORDER',
        quantity: -quantity,
        balanceAfter: current.preorderedStock + quantity,
        reason: reason ?? 'Reserva por preventa',
      },
    })
    return
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

export async function releaseReservedStock(tx: TransactionClient, input: StockOp): Promise<void> {
  const { productId, quantity, orderId, isPreorder = false, reason } = input

  const current = await tx.productInventory.findUnique({
    where: { productId },
    select: { availableStock: true, preorderedStock: true, version: true },
  })
  if (!current) return

  if (isPreorder) {
    const released = await tx.productInventory.updateMany({
      where: {
        productId,
        version: current.version,
        preorderedStock: { gte: quantity },
      },
      data: { preorderedStock: { decrement: quantity }, version: { increment: 1 } },
    })
    if (released.count === 0) throw new OptimisticLockError()

    await tx.inventoryMovement.create({
      data: {
        productId,
        orderId,
        type: 'RETURN',
        stockType: 'PREORDER',
        quantity,
        balanceAfter: current.preorderedStock - quantity,
        reason: reason ?? 'Preventa cancelada — reserva liberada',
      },
    })
    return
  }

  const updated = await tx.productInventory.updateMany({
    where: {
      productId,
      version: current.version,
      reservedStock: { gte: quantity },
    },
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

export async function finalizeReservedStock(tx: TransactionClient, input: StockOp): Promise<void> {
  const { productId, quantity, orderId, isPreorder = false, reason } = input

  const current = await tx.productInventory.findUnique({
    where: { productId },
    select: {
      availableStock: true,
      reservedStock: true,
      preorderedStock: true,
      version: true,
    },
  })
  if (!current) return

  if (isPreorder) {
    // La preventa cobrada deja de estar comprometida; no hay unidades físicas
    // que descontar, esas entran cuando llegue la mercadería.
    const done = await tx.productInventory.updateMany({
      where: {
        productId,
        version: current.version,
        preorderedStock: { gte: quantity },
      },
      data: { preorderedStock: { decrement: quantity }, version: { increment: 1 } },
    })
    if (done.count === 0) throw new OptimisticLockError()

    await tx.inventoryMovement.create({
      data: {
        productId,
        orderId,
        type: 'SALE',
        stockType: 'PREORDER',
        quantity: 0,
        balanceAfter: current.preorderedStock - quantity,
        reason: reason ?? 'Preventa aceptada — venta confirmada',
      },
    })
    return
  }

  const updated = await tx.productInventory.updateMany({
    where: {
      productId,
      version: current.version,
      reservedStock: { gte: quantity },
    },
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
