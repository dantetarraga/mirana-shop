import type { PublicReview, SerializedPublicReview } from '@/features/reviews/types'
import { Dates } from '@/shared/lib/dates'

/** "12 de octubre de 2026", calculado una sola vez en el servidor. */
export function serializePublicReview(review: PublicReview): SerializedPublicReview {
  return {
    ...review,
    createdAt: review.createdAt.toISOString(),
    dateLabel: Dates.format(review.createdAt),
  }
}
