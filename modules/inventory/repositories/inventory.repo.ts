import { db } from "@/shared/lib/db";
import type { InventoryMovementType, InventoryStockType } from "../../../generated/prisma";

// ---------------------------------------------------------------------------
// InventoryRepo — gestión de stock con optimistic locking
// ---------------------------------------------------------------------------

export type InventoryRow = {
  id: string;
  productId: string;
  availableStock: number;
  reservedStock: number;
  preorderedStock: number;
  lowStockThreshold: number | null;
  version: number;
  updatedAt: Date;
};

export type AdjustStockInput = {
  productId: string;
  delta: number;
  newStock?: number;
  type: InventoryMovementType;
  stockType?: InventoryStockType;
  reason?: string;
  createdById?: string;
  orderId?: string;
};

export class OptimisticLockError extends Error {
  constructor() {
    super("El inventario fue modificado concurrentemente. Intenta de nuevo.");
    this.name = "OptimisticLockError";
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
    });
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
    });
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
    });
  },

  /**
   * Ajusta el stock con optimistic locking via campo `version`.
   * Si el version de la BD cambió desde que leímos el registro, lanza OptimisticLockError.
   */
  async adjustStock(input: AdjustStockInput): Promise<InventoryRow> {
    const { productId, delta, newStock, type, stockType = "NORMAL", reason, createdById, orderId } = input;

    return db.$transaction(async (tx) => {
      const current = await tx.productInventory.findUnique({
        where: { productId },
        select: { id: true, availableStock: true, version: true },
      });

      if (!current) {
        throw new Error(`No existe inventario para el producto ${productId}`);
      }

      const nextStock =
        newStock !== undefined ? newStock : current.availableStock + delta;

      if (nextStock < 0) {
        throw new Error("El stock no puede ser negativo");
      }

      // Optimistic locking: el update solo afecta si version no cambió
      const updated = await tx.productInventory.updateMany({
        where: { productId, version: current.version },
        data: {
          availableStock: nextStock,
          version: { increment: 1 },
        },
      });

      if (updated.count === 0) {
        throw new OptimisticLockError();
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
      });

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
      });

      return result!;
    });
  },

  async getStats(): Promise<{
    totalUnits: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
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
    ]);

    // Valor del inventario requiere join con precio — usamos query separada
    const valueAgg = await db.$queryRaw<{ total_value: number }[]>`
      SELECT COALESCE(SUM(pi."availableStock" * p.price), 0)::float AS total_value
      FROM "ProductInventory" pi
      JOIN "Product" p ON p.id = pi."productId"
      WHERE p."deletedAt" IS NULL
    `;

    return {
      totalUnits: agg._sum.availableStock ?? 0,
      totalValue: valueAgg[0]?.total_value ?? 0,
      lowStockCount: low,
      outOfStockCount: out,
    };
  },
};
