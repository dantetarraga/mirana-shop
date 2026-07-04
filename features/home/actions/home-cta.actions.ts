'use server'

import { HOME_CTA_ID } from '@/features/home/queries/home-cta.queries'
import { db } from '@/shared/lib/db'
import { requireAdmin } from '@/shared/lib/require-admin'
import type { ActionResult } from '@/shared/types/action-result.types'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const homeCtaSchema = z.object({
  title: z.string().min(1, 'Título requerido').max(120),
  subtitle: z.string().max(200).optional().default(''),
  ctaLabel: z.string().max(40).optional().default(''),
  ctaHref: z.string().max(300).optional().default(''),
  imageUrl: z.string().url('URL de imagen inválida').optional().or(z.literal('')).default(''),
  active: z.boolean().default(true),
})

export async function saveHomeCta(rawInput: unknown): Promise<ActionResult> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = homeCtaSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
      code: 400,
    }
  }

  try {
    await db.homeCta.upsert({
      where: { id: HOME_CTA_ID },
      update: parsed.data,
      create: { id: HOME_CTA_ID, ...parsed.data },
    })

    revalidatePath('/')
    revalidatePath('/admin/cta')
    return { success: true, data: undefined }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al guardar el CTA'
    return { success: false, error: message, code: 500 }
  }
}
