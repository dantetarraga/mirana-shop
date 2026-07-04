'use server'

import { db } from '@/shared/lib/db'
import { requireAdmin } from '@/shared/lib/require-admin'
import type { ActionResult } from '@/shared/types/action-result.types'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const paymentAccountRowSchema = z.object({
  /** Vacío o ausente = cuenta nueva */
  id: z.string().optional().default(''),
  name: z.string().min(1, 'Nombre requerido (ej: Yape, BCP Soles)').max(60),
  holder: z.string().max(80).optional().default(''),
  number: z.string().min(1, 'Número requerido').max(40),
  cci: z.string().max(40).optional().default(''),
  active: z.boolean().default(true),
})

const paymentAccountsSchema = z.array(paymentAccountRowSchema).max(20, 'Máximo 20 métodos')

export type PaymentAccountInput = z.infer<typeof paymentAccountRowSchema>

/**
 * Guarda la lista completa de métodos de pago (reemplazo total):
 * actualiza los existentes, crea los nuevos y elimina los que ya no están.
 * El orden del array define la posición en el checkout.
 */
export async function savePaymentAccounts(rawRows: unknown): Promise<ActionResult> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = paymentAccountsSchema.safeParse(rawRows)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
      code: 400,
    }
  }

  const rows = parsed.data

  try {
    await db.$transaction(async (tx) => {
      const keepIds = rows.map((r) => r.id).filter(Boolean)
      await tx.paymentAccount.deleteMany({
        where: keepIds.length > 0 ? { id: { notIn: keepIds } } : {},
      })

      for (const [position, row] of rows.entries()) {
        const data = {
          name: row.name,
          holder: row.holder,
          number: row.number,
          cci: row.cci,
          active: row.active,
          position,
        }
        if (row.id) {
          await tx.paymentAccount.update({ where: { id: row.id }, data })
        } else {
          await tx.paymentAccount.create({ data })
        }
      }
    })

    revalidatePath('/checkout')
    revalidatePath('/admin/settings')
    return { success: true, data: undefined }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al guardar métodos de pago'
    return { success: false, error: message, code: 500 }
  }
}
