import 'server-only'
import { db } from '@/shared/lib/db'
import type { InventoryRow } from '@/features/inventory/types'

const SELECT = {
  id: true,
  productId: true,
  availableStock: true,
  reservedStock: true,
  preorderedStock: true,
  lowStockThreshold: true,
  version: true,
  updatedAt: true,
} as const

export async function getInventoryByProductId(productId: string): Promise<InventoryRow | null> {
  return db.productInventory.findUnique({
    where: { productId },
    select: SELECT,
  })
}

export async function getLowStockInventory(threshold = 8): Promise<InventoryRow[]> {
  return db.productInventory.findMany({
    where: {
      availableStock: { gt: 0, lte: threshold },
      product: { deletedAt: null },
    },
    select: SELECT,
  })
}

export async function getOutOfStockInventory(): Promise<InventoryRow[]> {
  return db.productInventory.findMany({
    where: {
      availableStock: 0,
      product: { deletedAt: null },
    },
    select: SELECT,
  })
}

export async function getInventoryStats(): Promise<{
  totalUnits: number
  totalValue: number
  lowStockCount: number
  outOfStockCount: number
}> {
  const [agg, low, out] = await Promise.all([
    db.productInventory.aggregate({
      _sum: { availableStock: true },
      where: { product: { deletedAt: null } },
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
    SELECT CAST(COALESCE(SUM(pi.availableStock * p.price), 0) AS DOUBLE) AS total_value
    FROM \`ProductInventory\` pi
    JOIN \`Product\` p ON p.id = pi.productId
    WHERE p.deletedAt IS NULL
  `

  return {
    totalUnits: agg._sum.availableStock ?? 0,
    totalValue: valueAgg[0]?.total_value ?? 0,
    lowStockCount: low,
    outOfStockCount: out,
  }
}
