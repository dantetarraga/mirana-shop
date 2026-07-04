'use server'

import { BANNER_SELECT } from '@/features/banners/queries/banner.queries'
import { bannerDbSchema } from '@/features/banners/schemas/banner.schema'
import { db } from '@/shared/lib/db'
import { requireAdmin } from '@/shared/lib/require-admin'
import type { ActionResult } from '@/shared/types/action-result.types'
import { revalidatePath, revalidateTag } from 'next/cache'

function invalidateBannerCaches() {
  revalidatePath('/admin/banners')
  revalidatePath('/admin/dashboard')
  revalidatePath('/')
  revalidateTag('banners', 'max')
}

export async function saveBanner(
  id: string | null,
  rawInput: unknown,
): Promise<ActionResult<{ id: string }>> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = bannerDbSchema.safeParse(rawInput)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Datos inválidos'
    return { success: false, error: firstError, code: 400 }
  }

  const input = parsed.data

  try {
    if (id) {
      const updated = await db.banner.update({
        where: { id },
        data: {
          title: input.title,
          subtitle: input.subtitle || undefined,
          ctaLabel: input.ctaLabel || undefined,
          ctaHref: input.ctaHref || undefined,
          imageUrl: input.imageUrl,
          position: input.position,
          active: input.active,
        },
        select: BANNER_SELECT,
      })
      invalidateBannerCaches()
      return { success: true, data: { id: updated.id } }
    } else {
      const created = await db.banner.create({
        data: {
          title: input.title,
          subtitle: input.subtitle || null,
          ctaLabel: input.ctaLabel || null,
          ctaHref: input.ctaHref || null,
          imageUrl: input.imageUrl,
          position: input.position ?? 0,
          active: input.active ?? false,
        },
        select: BANNER_SELECT,
      })
      invalidateBannerCaches()
      return { success: true, data: { id: created.id } }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al guardar banner'
    return { success: false, error: message, code: 500 }
  }
}

export async function toggleBanner(id: string, currentActive: boolean): Promise<ActionResult> {
  const denied = await requireAdmin()
  if (denied) return denied

  if (!id) return { success: false, error: 'ID de banner requerido', code: 400 }

  try {
    await db.banner.update({ where: { id }, data: { active: !currentActive } })
    invalidateBannerCaches()
    return { success: true, data: undefined }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al cambiar estado del banner'
    return { success: false, error: message, code: 500 }
  }
}

export async function deleteBanner(id: string): Promise<ActionResult> {
  const denied = await requireAdmin()
  if (denied) return denied

  if (!id) return { success: false, error: 'ID de banner requerido', code: 400 }

  try {
    await db.banner.delete({ where: { id } })
    invalidateBannerCaches()
    return { success: true, data: undefined }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al eliminar banner'
    return { success: false, error: message, code: 500 }
  }
}
