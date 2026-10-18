// ---------------------------------------------------------------------------
// JSON-LD de schema.org para reseñas. Solo se publican reseñas APROBADAS y el
// AggregateRating se omite si no hay ninguna (Google lo marca como error).
//
// Uso en el PDP:
//   aggregateRating: aggregateRatingJsonLd(summary),
//   review: reviews.slice(0, 5).map(reviewJsonLd),
// ---------------------------------------------------------------------------

export interface AggregateRatingJsonLd {
  '@type': 'AggregateRating'
  ratingValue: number
  reviewCount: number
  bestRating: 5
  worstRating: 1
}

export interface ReviewJsonLd {
  '@type': 'Review'
  author: { '@type': 'Person'; name: string }
  datePublished: string
  name?: string
  reviewBody: string
  reviewRating: { '@type': 'Rating'; ratingValue: number; bestRating: 5; worstRating: 1 }
}

export function aggregateRatingJsonLd(
  summary: { average: number; count: number } | null | undefined,
): AggregateRatingJsonLd | undefined {
  if (!summary || summary.count <= 0) return undefined
  return {
    '@type': 'AggregateRating',
    ratingValue: summary.average,
    reviewCount: summary.count,
    bestRating: 5,
    worstRating: 1,
  }
}

export function reviewJsonLd(review: {
  authorName: string
  rating: number
  title: string | null
  body: string
  createdAt: Date | string
}): ReviewJsonLd {
  const date = review.createdAt instanceof Date ? review.createdAt : new Date(review.createdAt)
  return {
    '@type': 'Review',
    author: { '@type': 'Person', name: review.authorName },
    datePublished: date.toISOString().slice(0, 10),
    ...(review.title ? { name: review.title } : {}),
    reviewBody: review.body,
    reviewRating: { '@type': 'Rating', ratingValue: review.rating, bestRating: 5, worstRating: 1 },
  }
}
