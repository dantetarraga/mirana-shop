'use server'

import { reviewIdSchema, type ReviewStatusValue } from '@/features/reviews/schemas/review.schema'
import { db } from '@/shared/lib/db'
import { prismaFailure } from '@/shared/lib/prisma-errors'
import { requireAdmin } from '@/shared/lib/require-admin'
import type { ActionResult } from '@/shared/types/action-result.types'
import { revalidatePath, revalidateTag } from 'next/cache'

// ---------------------------------------------------------------------------
// Moderación de reseñas. Solo las APPROVED son públicas; cualquier cambio de
// estado o borrado invalida la caché de reseñas, la ficha y el inicio.
// ---------------------------------------------------------------------------

const MESSAGES = {
  notFound: 'La reseña ya no existe. Recarga la página.',
  fallback: 'No se pudo actualizar la reseña. Inténtalo de nuevo.',
}

function revalidateReview(productSlug: string) {
  revalidateTag('reviews', 'max')
  revalidatePath(`/catalogo/${productSlug}`)
  revalidatePath('/')
  revalidatePath('/admin/reviews')
}

async function moderate(
  rawInput: unknown,
  status: Extract<ReviewStatusValue, 'APPROVED' | 'REJECTED'>,
): Promise<ActionResult<{ id: string; status: ReviewStatusValue }>> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = reviewIdSchema.safeParse(rawInput)
  if (!parsed.success) return { success: false, error: 'Reseña inválida', code: 400 }

  try {
    const review = await db.review.update({
      where: { id: parsed.data.reviewId },
      data: { status, moderatedAt: new Date() },
      select: { id: true, status: true, product: { select: { slug: true } } },
    })
    revalidateReview(review.product.slug)
    return { success: true, data: { id: review.id, status: review.status } }
  } catch (err) {
    console.error(`[moderateReview:${status}]`, err)
    return prismaFailure(err, MESSAGES)
  }
}

export async function approveReview(input: { reviewId: string }) {
  return moderate(input, 'APPROVED')
}

export async function rejectReview(input: { reviewId: string }) {
  return moderate(input, 'REJECTED')
}

/** Borrado definitivo (spam, datos personales). Para ocultarla basta con rechazarla. */
export async function deleteReview(input: { reviewId: string }): Promise<ActionResult<{ id: string }>> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = reviewIdSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'Reseña inválida', code: 400 }

  try {
    const review = await db.review.delete({
      where: { id: parsed.data.reviewId },
      select: { id: true, product: { select: { slug: true } } },
    })
    revalidateReview(review.product.slug)
    return { success: true, data: { id: review.id } }
  } catch (err) {
    console.error('[deleteReview]', err)
    return prismaFailure(err, { ...MESSAGES, fallback: 'No se pudo eliminar la reseña.' })
  }
}
