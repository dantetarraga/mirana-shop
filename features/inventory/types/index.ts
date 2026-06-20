import type { InventoryMovementType, InventoryStockType } from '@/generated/prisma/client'

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
