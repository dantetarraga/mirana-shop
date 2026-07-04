'use server'

import type { PromotionType } from '@/generated/prisma/client'
import { serializePromotion } from '@/features/promotions/queries/promotion.queries'
import { promotionDbSchema } from '@/features/promotions/schemas/promotion.schema'
import { db } from '@/shared/lib/db'
import { requireAdmin } from '@/shared/lib/require-admin'
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
  const denied = await requireAdmin()
  if (denied) return denied

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
      const row = await db.promotion.update({
        where: { id },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.type !== undefined && { type: input.type }),
          ...(input.active !== undefined && { active: input.active }),
          ...(input.minAmount !== undefined && { minAmount: input.minAmount }),
          ...(input.discountAmount !== undefined && { discountAmount: input.discountAmount }),
          ...(input.discountPercent !== undefined && { discountPercent: input.discountPercent }),
          ...(input.startsAt !== undefined && { startsAt: input.startsAt }),
          ...(input.endsAt !== undefined && { endsAt: input.endsAt }),
        },
      })
      const updated = serializePromotion(row)
      invalidateCaches()
      return { success: true, data: { id: updated.id } }
    } else {
      const row = await db.promotion.create({
        data: {
          name: input.name,
          description: input.description,
          type: input.type,
          active: input.active ?? true,
          minAmount: input.minAmount,
          discountAmount: input.discountAmount,
          discountPercent: input.discountPercent,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
        },
      })
      const created = serializePromotion(row)
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
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    await db.promotion.update({ where: { id }, data: { active: !active } })
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
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    await db.promotion.delete({ where: { id } })
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
