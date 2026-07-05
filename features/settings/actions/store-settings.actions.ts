'use server'

import { STORE_SETTINGS_ID } from '@/features/settings/queries/store-settings.queries'
import { db } from '@/shared/lib/db'
import { requireAdmin } from '@/shared/lib/require-admin'
import type { ActionResult } from '@/shared/types/action-result.types'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const storeSettingsSchema = z.object({
  showOutOfStock: z.boolean(),
  whatsappNumber: z
    .string()
    .regex(/^\d*$/, 'Solo dígitos, con código de país (ej: 51987654321)')
    .max(15, 'Número demasiado largo'),
  baseShippingCost: z.number().min(0, 'Debe ser mayor o igual a 0'),
})

export async function saveStoreSettings(rawInput: unknown): Promise<ActionResult> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = storeSettingsSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
      code: 400,
    }
  }

  try {
    await db.storeSettings.upsert({
      where: { id: STORE_SETTINGS_ID },
      update: parsed.data,
      create: { id: STORE_SETTINGS_ID, ...parsed.data },
    })

    revalidatePath('/')
    revalidatePath('/catalogo')
    revalidatePath('/checkout')
    revalidatePath('/admin/settings')
    return { success: true, data: undefined }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al guardar la configuración'
    return { success: false, error: message, code: 500 }
  }
}
