'use server'

import { generateAdminAlerts } from '@/features/alerts/lib/generate-alerts'
import { db } from '@/shared/lib/db'
import { requireAdmin } from '@/shared/lib/require-admin'
import type { ActionResult } from '@/shared/types/action-result.types'
import { revalidatePath } from 'next/cache'

/** Ejecuta el analizador de alertas bajo demanda (mismo motor que el cron). */
export async function generateAlertsNow(): Promise<ActionResult<{ generated: number }>> {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const result = await generateAdminAlerts()
    revalidatePath('/admin', 'layout')
    return { success: true, data: { generated: result.generated } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al generar alertas'
    return { success: false, error: message, code: 500 }
  }
}

export async function markAllAlertsRead(): Promise<ActionResult> {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    await db.adminAlert.updateMany({
      where: { readAt: null },
      data: { readAt: new Date() },
    })
    revalidatePath('/admin', 'layout')
    return { success: true, data: undefined }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al marcar alertas'
    return { success: false, error: message, code: 500 }
  }
}
