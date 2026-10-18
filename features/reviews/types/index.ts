import type { ReviewStatusValue } from '@/features/reviews/schemas/review.schema'

/** Reseña pública (solo APPROVED). Sin email ni id de usuario. */
export interface PublicReview {
  id: string
  rating: number
  title: string | null
  body: string
  authorName: string
  verifiedPurchase: boolean
  createdAt: Date
}

/**
 * Reseña pública serializada para cruzar al cliente: fecha ISO y la etiqueta
 * ya formateada en el servidor (sin desfase de zona horaria al hidratar).
 */
export type SerializedPublicReview = Omit<PublicReview, 'createdAt'> & {
  createdAt: string
  dateLabel: string
}

export interface ProductReviewsPage {
  reviews: PublicReview[]
  total: number
  page: number
  perPage: number
  hasMore: boolean
}

export interface HomeReview extends PublicReview {
  product: { name: string; slug: string; imageUrl: string | null; imageAlt: string | null }
}

export interface StoreReviewSummary {
  average: number
  count: number
}

/** Reseña propia para prellenar el formulario. */
export interface MyReview {
  id: string
  rating: number
  title: string | null
  body: string
  status: ReviewStatusValue
  verifiedPurchase: boolean
  updatedAt: string
}

export interface AdminReviewRow {
  id: string
  rating: number
  title: string | null
  body: string
  status: ReviewStatusValue
  verifiedPurchase: boolean
  createdAt: Date
  moderatedAt: Date | null
  product: { id: string; name: string; slug: string; deletedAt: Date | null }
  user: { id: string; name: string | null; email: string }
}

export interface AdminReviewFilters {
  status: ReviewStatusValue
  page: number
  q?: string
  perPage?: number
}
