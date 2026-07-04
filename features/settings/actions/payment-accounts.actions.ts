'use server'

import { db } from '@/shared/lib/db'
import { requireAdmin } from '@/shared/lib/require-admin'
import type { ActionResult } from '@/shared/types/action-result.types'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Métodos de pago del checkout (Yape, BCP, BBVA, etc.) — CRUD granular con el
// mismo patrón de los demás módulos del admin (drawer + confirmación).
// ---------------------------------------------------------------------------

const paymentAccountSchema = z.object({
  name: z.string().min(1, 'Nombre requerido (ej: Yape, BCP Soles)').max(60),
  holder: z.string().max(80).optional().default(''),
  number: z.string().min(1, 'Número requerido').max(40),
  cci: z.string().max(40).optional().default(''),
  active: z.boolean().default(true),
})

export type PaymentAccountInput = z.infer<typeof paymentAccountSchema>

function invalidatePaymentCaches() {
  revalidatePath('/checkout')
  revalidatePath('/admin/settings')
}

export async function savePaymentAccount(
  id: string | null,
  rawInput: unknown,
): Promise<ActionResult<{ id: string }>> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = paymentAccountSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
      code: 400,
    }
  }

  try {
    if (id) {
      const updated = await db.paymentAccount.update({
        where: { id },
        data: parsed.data,
        select: { id: true },
      })
      invalidatePaymentCaches()
      return { success: true, data: { id: updated.id } }
    }

    const position = await db.paymentAccount.count()
    const created = await db.paymentAccount.create({
      data: { ...parsed.data, position },
      select: { id: true },
    })
    invalidatePaymentCaches()
    return { success: true, data: { id: created.id } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al guardar el método de pago'
    return { success: false, error: message, code: 500 }
  }
}

export async function deletePaymentAccount(id: string): Promise<ActionResult> {
  const denied = await requireAdmin()
  if (denied) return denied

  if (!id) return { success: false, error: 'ID requerido', code: 400 }

  try {
    await db.paymentAccount.delete({ where: { id } })
    invalidatePaymentCaches()
    return { success: true, data: undefined }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al eliminar el método de pago'
    return { success: false, error: message, code: 500 }
  }
}
