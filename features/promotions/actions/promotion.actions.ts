'use server'

import type { PromotionType } from '@/generated/prisma/client'
import { promotionRepo } from '@/features/promotions/services/promotion.service'
import { promotionDbSchema } from '@/shared/lib/schemas'
import type { ActionResult } from '@/shared/types/action-result.types'
import { revalidatePath } from 'next/cache'

function invalidateCaches() {
  revalidatePath('/admin/promotions')
  revalidatePath('/admin/dashboard')
}

export async function savePromotion(
  id: string | null,
  rawInput: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = promotionDbSchema.safeParse(rawInput)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Datos inválidos'
    return { success: false, error: firstError, code: 400 }
  }

  const d = parsed.data

  const input = {
    name: d.name,
    description: d.description || undefined,
    type: d.type as PromotionType,
    active: d.active,
    minAmount: d.minAmount,
    discountAmount: d.discountAmount,
    discountPercent: d.discountPercent,
    startsAt: d.startsAt ? new Date(d.startsAt) : undefined,
    endsAt: d.endsAt ? new Date(d.endsAt) : undefined,
  }

  try {
    if (id) {
      const updated = await promotionRepo.update({ id, ...input })
      invalidateCaches()
      return { success: true, data: { id: updated.id } }
    } else {
      const created = await promotionRepo.create(input)
      invalidateCaches()
      return { success: true, data: { id: created.id } }
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al guardar',
      code: 500,
    }
  }
}

export async function togglePromotion(id: string, active: boolean): Promise<ActionResult> {
  try {
    await promotionRepo.toggle(id, active)
    invalidateCaches()
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al cambiar estado',
      code: 500,
    }
  }
}

export async function deletePromotion(id: string): Promise<ActionResult> {
  try {
    await promotionRepo.delete(id)
    invalidateCaches()
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al eliminar',
      code: 500,
    }
  }
}
