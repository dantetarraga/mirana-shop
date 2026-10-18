'use server'

import { serializePublicReview } from '@/features/reviews/lib/serialize-review'
import { getProductReviews, PUBLIC_PRODUCT_WHERE } from '@/features/reviews/queries/review.queries'
import { reviewInputSchema } from '@/features/reviews/schemas/review.schema'
import type { MyReview, SerializedPublicReview } from '@/features/reviews/types'
import { db } from '@/shared/lib/db'
import { prismaFailure } from '@/shared/lib/prisma-errors'
import { consumeRateLimits, RateLimitError, requestIp } from '@/shared/lib/rate-limit'
import { requireUser } from '@/shared/lib/require-user'
import type { ActionResult } from '@/shared/types/action-result.types'
import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Reseñas del cliente. Toda reseña (nueva o editada) entra como PENDING y solo
// se publica cuando el admin la aprueba: así no se cuelan reseñas falsas ni
// spam (Ley 29571). El usuario y la "compra verificada" se derivan SIEMPRE del
// servidor; nunca se aceptan del cliente.
// ---------------------------------------------------------------------------

/** Pedidos que cuentan como compra: pagados o ya en preparación/envío/entregados. */
const PURCHASED_ORDER_STATUSES = ['PAID', 'PREPARING', 'SHIPPED', 'DELIVERED'] as const

const REVIEW_LIMIT_PER_USER = 10
const REVIEW_LIMIT_PER_IP = 30
const REVIEW_WINDOW_MS = 60 * 60_000

export type SubmitReviewData = { status: 'PENDING'; review: MyReview }

export type SubmitReviewResult =
  | ActionResult<SubmitReviewData>
  | { success: false; error: string; code: 400; fieldErrors: Record<string, string> }

const productIdSchema = z.string().trim().min(1).max(64)

function toMyReview(r: {
  id: string
  rating: number
  title: string | null
  body: string
  status: MyReview['status']
  verifiedPurchase: boolean
  updatedAt: Date
}): MyReview {
  return { ...r, updatedAt: r.updatedAt.toISOString() }
}

const MY_REVIEW_SELECT = {
  id: true,
  rating: true,
  title: true,
  body: true,
  status: true,
  verifiedPurchase: true,
  updatedAt: true,
} as const

async function hasPurchased(userId: string, productId: string): Promise<boolean> {
  const item = await db.orderItem.findFirst({
    where: {
      productId,
      order: {
        userId,
        OR: [{ paymentStatus: 'PAID' }, { status: { in: [...PURCHASED_ORDER_STATUSES] } }],
      },
    },
    select: { id: true },
  })
  return item !== null
}

function revalidateProductReviews(slug: string) {
  revalidateTag('reviews', 'max')
  revalidatePath(`/catalogo/${slug}`)
  revalidatePath('/')
}

// ── submitReview ────────────────────────────────────────────────────────────

export async function submitReview(rawInput: unknown): Promise<SubmitReviewResult> {
  const session = await requireUser()
  if (session.denied) return session.denied

  // El rate limit se consume ANTES de validar/transformar el cuerpo: así un
  // cliente no puede forzar trabajo de saneado sin gastar su cupo.
  try {
    await consumeRateLimits([
      { scope: 'review-user', subject: session.id, limit: REVIEW_LIMIT_PER_USER, windowMs: REVIEW_WINDOW_MS },
      { scope: 'review-ip', subject: await requestIp(), limit: REVIEW_LIMIT_PER_IP, windowMs: REVIEW_WINDOW_MS },
    ])
  } catch (err) {
    if (err instanceof RateLimitError) return { success: false, error: err.message, code: 429 }
    console.error('[submitReview] rate limit', err)
    return { success: false, error: 'No se pudo enviar tu reseña. Inténtalo de nuevo.', code: 500 }
  }

  const parsed = reviewInputSchema.safeParse(rawInput)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.')
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return { success: false, error: 'Revisa los campos marcados.', code: 400, fieldErrors }
  }
  const { productId, rating, title, body } = parsed.data

  const product = await db.product.findFirst({
    where: { id: productId, ...PUBLIC_PRODUCT_WHERE },
    select: { id: true, slug: true },
  })
  if (!product) {
    return { success: false, error: 'Este producto ya no está disponible para reseñas.', code: 404 }
  }

  try {
    const verifiedPurchase = await hasPurchased(session.id, product.id)

    const review = await db.review.upsert({
      where: { productId_userId: { productId: product.id, userId: session.id } },
      create: {
        productId: product.id,
        userId: session.id,
        rating,
        title: title ?? null,
        body,
        verifiedPurchase,
        status: 'PENDING',
      },
      // Editar una reseña la devuelve a moderación.
      update: {
        rating,
        title: title ?? null,
        body,
        verifiedPurchase,
        status: 'PENDING',
        moderatedAt: null,
      },
      select: MY_REVIEW_SELECT,
    })

    // Siempre se invalida: leer el estado previo aparte es una carrera (otra
    // pestaña o el admin pudo aprobarla entre la lectura y el upsert) y una
    // reseña que estaba publicada debe dejar de mostrarse hasta re-aprobarse.
    revalidateProductReviews(product.slug)

    return { success: true, data: { status: 'PENDING', review: toMyReview(review) } }
  } catch (err) {
    console.error('[submitReview]', err)
    return prismaFailure(err, {
      unique: 'Ya enviaste una reseña de este producto. Recarga la página para editarla.',
      foreignKey: 'Este producto ya no está disponible para reseñas.',
      fallback: 'No se pudo enviar tu reseña. Inténtalo de nuevo.',
    })
  }
}

// ── getMyReview ─────────────────────────────────────────────────────────────

/** Reseña propia del usuario en sesión (cualquier estado), o null. */
export async function getMyReview(productId: string): Promise<MyReview | null> {
  const id = productIdSchema.safeParse(productId)
  if (!id.success) return null
  const session = await requireUser()
  if (session.denied) return null

  const review = await db.review.findUnique({
    where: { productId_userId: { productId: id.data, userId: session.id } },
    select: MY_REVIEW_SELECT,
  })
  return review ? toMyReview(review) : null
}

// ── loadProductReviews ("Ver más") ──────────────────────────────────────────

const loadSchema = z.object({
  productId: productIdSchema,
  page: z.number().int().min(1).max(1000),
})

/** Página siguiente de reseñas aprobadas. Lectura pública cacheada. */
export async function loadProductReviews(
  productId: string,
  page: number,
): Promise<ActionResult<{ reviews: SerializedPublicReview[]; hasMore: boolean }>> {
  const parsed = loadSchema.safeParse({ productId, page })
  if (!parsed.success) return { success: false, error: 'Solicitud inválida', code: 400 }

  try {
    const result = await getProductReviews(parsed.data.productId, { page: parsed.data.page })
    return {
      success: true,
      data: {
        reviews: result.reviews.map(serializePublicReview),
        hasMore: result.hasMore,
      },
    }
  } catch (err) {
    console.error('[loadProductReviews]', err)
    return { success: false, error: 'No se pudieron cargar más opiniones.', code: 500 }
  }
}
