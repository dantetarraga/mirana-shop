'use server'

import { LEGAL_SLUGS } from '@/features/legal/queries/legal.queries'
import { db } from '@/shared/lib/db'
import { requireAdmin } from '@/shared/lib/require-admin'
import type { ActionResult } from '@/shared/types/action-result.types'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const legalPageSchema = z.object({
  slug: z.enum([LEGAL_SLUGS.terms, LEGAL_SLUGS.privacy]),
  title: z.string().min(1, 'Título requerido').max(150),
  content: z.string().max(200_000, 'Contenido demasiado largo'),
})

export async function saveLegalPage(rawInput: unknown): Promise<ActionResult<{ slug: string }>> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = legalPageSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
      code: 400,
    }
  }

  const { slug, title, content } = parsed.data

  try {
    await db.legalPage.upsert({
      where: { slug },
      update: { title, content },
      create: { slug, title, content },
    })

    revalidatePath(`/${slug}`)
    revalidatePath('/admin/legal')
    return { success: true, data: { slug } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al guardar la página'
    return { success: false, error: message, code: 500 }
  }
}
