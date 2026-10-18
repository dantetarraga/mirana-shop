'use server'

import {
  reviewIdSchema,
  reviewModerationSchema,
  type ReviewStatusValue,
} from '@/features/reviews/schemas/review.schema'
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
  stale: 'La reseña cambió mientras la revisabas; recarga para ver la versión nueva',
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

  const parsed = reviewModerationSchema.safeParse(rawInput)
  if (!parsed.success) return { success: false, error: 'Reseña inválida', code: 400 }
  const { reviewId, seenUpdatedAt } = parsed.data

  try {
    // Bloqueo optimista: solo se modera la versión que el admin tenía en
    // pantalla. Si el autor la editó mientras tanto (updatedAt distinto), no se
    // publica un texto que nadie revisó.
    const { count } = await db.review.updateMany({
      where: { id: reviewId, updatedAt: seenUpdatedAt },
      data: { status, moderatedAt: new Date() },
    })
    if (count === 0) {
      const exists = await db.review.findUnique({ where: { id: reviewId }, select: { id: true } })
      return exists
        ? { success: false, error: MESSAGES.stale, code: 409 }
        : { success: false, error: MESSAGES.notFound, code: 404 }
    }

    const review = await db.review.findUniqueOrThrow({
      where: { id: reviewId },
      select: { id: true, status: true, product: { select: { slug: true } } },
    })
    revalidateReview(review.product.slug)
    return { success: true, data: { id: review.id, status: review.status } }
  } catch (err) {
    console.error(`[moderateReview:${status}]`, err)
    return prismaFailure(err, MESSAGES)
  }
}

type ModerationInput = { reviewId: string; seenUpdatedAt: string }

export async function approveReview(input: ModerationInput) {
  return moderate(input, 'APPROVED')
}

export async function rejectReview(input: ModerationInput) {
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
