'use server'

import { couponDbSchema } from '@/features/coupons/schemas/coupon.schema'
import { normalizeCouponCode } from '@/features/coupons/types'
import { db } from '@/shared/lib/db'
import { requireAdmin } from '@/shared/lib/require-admin'
import type { ActionResult } from '@/shared/types/action-result.types'
import { revalidatePath } from 'next/cache'

function invalidateCouponCaches() {
  revalidatePath('/admin/coupons')
  revalidatePath('/admin/promotions')
  revalidatePath('/checkout')
}

export async function saveCoupon(
  id: string | null,
  rawInput: unknown,
): Promise<ActionResult<{ id: string }>> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = couponDbSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos', code: 400 }
  }

  const d = parsed.data
  const data = {
    // Siempre en mayúsculas: el checkout compara contra el código normalizado.
    code: normalizeCouponCode(d.code),
    promotionId: d.promotionId,
    active: d.active,
    maxUses: d.maxUses ?? null,
    startsAt: d.startsAt ? new Date(d.startsAt) : null,
    endsAt: d.endsAt ? new Date(d.endsAt) : null,
  }

  try {
    const row = id
      ? await db.coupon.update({ where: { id }, data, select: { id: true } })
      : await db.coupon.create({ data, select: { id: true } })

    invalidateCouponCaches()
    return { success: true, data: { id: row.id } }
  } catch (err) {
    const isDuplicate =
      typeof err === 'object' && err !== null && (err as { code?: string }).code === 'P2002'
    if (isDuplicate) {
      return { success: false, error: `Ya existe un cupón con el código ${data.code}`, code: 400 }
    }
    const message = err instanceof Error ? err.message : 'Error al guardar el cupón'
    return { success: false, error: message, code: 500 }
  }
}

export async function toggleCoupon(id: string, active: boolean): Promise<ActionResult> {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    await db.coupon.update({ where: { id }, data: { active: !active } })
    invalidateCouponCaches()
    return { success: true, data: undefined }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al cambiar el estado'
    return { success: false, error: message, code: 500 }
  }
}

export async function deleteCoupon(id: string): Promise<ActionResult> {
  const denied = await requireAdmin()
  if (denied) return denied

  if (!id) return { success: false, error: 'ID requerido', code: 400 }

  try {
    // Los pedidos que lo usaron conservan `couponCode` como snapshot: borrar el
    // cupón solo deja su FK en null, no altera el historial.
    await db.coupon.delete({ where: { id } })
    invalidateCouponCaches()
    return { success: true, data: undefined }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al eliminar el cupón'
    return { success: false, error: message, code: 500 }
  }
}
