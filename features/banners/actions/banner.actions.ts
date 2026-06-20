'use server'

import { bannerRepo } from '@/features/banners/services/banner.service'
import { bannerDbSchema } from '@/shared/lib/schemas'
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
  const parsed = bannerDbSchema.safeParse(rawInput)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Datos inválidos'
    return { success: false, error: firstError, code: 400 }
  }

  const input = parsed.data

  try {
    if (id) {
      const updated = await bannerRepo.update({
        id,
        title: input.title,
        subtitle: input.subtitle || undefined,
        ctaLabel: input.ctaLabel || undefined,
        ctaHref: input.ctaHref || undefined,
        imageUrl: input.imageUrl,
        position: input.position,
        active: input.active,
      })
      invalidateBannerCaches()
      return { success: true, data: { id: updated.id } }
    } else {
      const created = await bannerRepo.create({
        title: input.title,
        subtitle: input.subtitle || undefined,
        ctaLabel: input.ctaLabel || undefined,
        ctaHref: input.ctaHref || undefined,
        imageUrl: input.imageUrl,
        position: input.position,
        active: input.active,
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
  if (!id) return { success: false, error: 'ID de banner requerido', code: 400 }

  try {
    await bannerRepo.toggle(id, !currentActive)
    invalidateBannerCaches()
    return { success: true, data: undefined }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al cambiar estado del banner'
    return { success: false, error: message, code: 500 }
  }
}

export async function deleteBanner(id: string): Promise<ActionResult> {
  if (!id) return { success: false, error: 'ID de banner requerido', code: 400 }

  try {
    await bannerRepo.delete(id)
    invalidateBannerCaches()
    return { success: true, data: undefined }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al eliminar banner'
    return { success: false, error: message, code: 500 }
  }
}
