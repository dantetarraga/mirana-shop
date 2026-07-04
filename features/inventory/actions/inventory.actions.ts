'use server'

import { OptimisticLockError } from '@/features/inventory/lib/stock'
import { adjustStockSchema } from '@/features/inventory/schemas/inventory.schema'
import { db } from '@/shared/lib/db'
import { requireAdmin } from '@/shared/lib/require-admin'
import type { ActionResult } from '@/shared/types/action-result.types'
import { revalidatePath } from 'next/cache'

export async function adjustStock(rawInput: unknown): Promise<ActionResult<{ newStock: number }>> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = adjustStockSchema.safeParse(rawInput)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Datos inválidos'
    return { success: false, error: firstError, code: 400 }
  }

  const { productId, newStock, reason } = parsed.data

  const MAX_RETRIES = 3
  let attempts = 0

  while (attempts < MAX_RETRIES) {
    try {
      const result = await db.$transaction(async (tx) => {
        const current = await tx.productInventory.findUnique({
          where: { productId },
          select: { id: true, availableStock: true, version: true },
        })

        if (!current) {
          throw new Error(`No existe inventario para el producto ${productId}`)
        }

        if (newStock < 0) {
          throw new Error('El stock no puede ser negativo')
        }

        const updated = await tx.productInventory.updateMany({
          where: { productId, version: current.version },
          data: {
            availableStock: newStock,
            version: { increment: 1 },
          },
        })

        if (updated.count === 0) {
          throw new OptimisticLockError()
        }

        await tx.inventoryMovement.create({
          data: {
            productId,
            type: 'ADJUSTMENT',
            stockType: 'NORMAL',
            quantity: newStock - current.availableStock,
            balanceAfter: newStock,
            reason: reason ?? 'Ajuste manual desde admin',
          },
        })

        return tx.productInventory.findUniqueOrThrow({
          where: { productId },
          select: { availableStock: true },
        })
      })

      revalidatePath('/admin/inventory')
      revalidatePath('/admin/dashboard')
      revalidatePath('/catalogo')
      revalidatePath('/')

      return { success: true, data: { newStock: result.availableStock } }
    } catch (err) {
      if (err instanceof OptimisticLockError) {
        attempts++
        if (attempts >= MAX_RETRIES) {
          return {
            success: false,
            error: 'El inventario fue modificado concurrentemente. Intenta de nuevo.',
            code: 409,
          }
        }
        await new Promise((r) => setTimeout(r, 50 * attempts))
        continue
      }

      const message = err instanceof Error ? err.message : 'Error al ajustar stock'
      return { success: false, error: message, code: 500 }
    }
  }

  return { success: false, error: 'No se pudo completar el ajuste de inventario', code: 500 }
}
