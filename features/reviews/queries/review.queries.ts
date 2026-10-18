import 'server-only'

import { DEFAULT_CATALOG_STATUSES } from '@/features/products/lib/availability'
import { formatAuthorName } from '@/features/reviews/lib/author-name'
import { computeReviewSummary, roundAverage, type ReviewSummary } from '@/features/reviews/lib/review-summary'
import type {
  HomeReview,
  ProductReviewsPage,
  PublicReview,
  StoreReviewSummary,
} from '@/features/reviews/types'
import { CACHE_TAGS, cachedQuery, REVALIDATE_SHORT, reviveDate } from '@/shared/lib/data-cache'
import { db } from '@/shared/lib/db'
import { cache } from 'react'

// ---------------------------------------------------------------------------
// Lecturas públicas de reseñas. SOLO estado APPROVED: la moderación previa es
// lo que impide publicar reseñas falsas o spam (Código de Protección al
// Consumidor, Ley 29571 — publicidad veraz).
//
// Cacheadas con los tags 'reviews' (moderación) y 'products' (un producto
// archivado o borrado deja de enlazarse en el inicio).
// ---------------------------------------------------------------------------

const CACHE_OPTIONS = {
  tags: [CACHE_TAGS.reviews, CACHE_TAGS.products],
  revalidate: REVALIDATE_SHORT,
}

export const PRODUCT_REVIEWS_PER_PAGE = 6
const MAX_PER_PAGE = 24

/** Producto visible en la tienda (mismos estados que el catálogo). */
export const PUBLIC_PRODUCT_WHERE = {
  deletedAt: null,
  status: { in: DEFAULT_CATALOG_STATUSES },
}

/**
 * Reseña publicable: aprobada, de una cuenta activa y de un producto visible en
 * la tienda (un producto borrado o archivado no expone sus reseñas).
 */
const APPROVED_WHERE = {
  status: 'APPROVED' as const,
  user: { deletedAt: null },
  product: PUBLIC_PRODUCT_WHERE,
}

const PUBLIC_REVIEW_SELECT = {
  id: true,
  rating: true,
  title: true,
  body: true,
  verifiedPurchase: true,
  createdAt: true,
  user: { select: { name: true } },
} as const

type PublicReviewRow = {
  id: string
  rating: number
  title: string | null
  body: string
  verifiedPurchase: boolean
  createdAt: Date
  user: { name: string | null }
}

function toPublicReview({ user, ...r }: PublicReviewRow): PublicReview {
  return { ...r, authorName: formatAuthorName(user.name) }
}

function revivePublic<T extends PublicReview>(r: T): T {
  return { ...r, createdAt: reviveDate(r.createdAt) }
}

// ── Resumen por producto ────────────────────────────────────────────────────

async function fetchProductReviewSummary(productId: string): Promise<ReviewSummary> {
  const rows = await db.review.groupBy({
    by: ['rating'],
    where: { productId, ...APPROVED_WHERE },
    _count: { _all: true },
  })
  return computeReviewSummary(rows.map((r) => ({ rating: r.rating, count: r._count._all })))
}

/** Promedio (1 decimal), total y distribución 1..5 de las reseñas aprobadas. */
export const getProductReviewSummary = cache(
  cachedQuery(fetchProductReviewSummary, ['product-review-summary'], CACHE_OPTIONS),
)

// ── Listado por producto ────────────────────────────────────────────────────

async function fetchProductReviews(
  productId: string,
  page: number,
  perPage: number,
): Promise<ProductReviewsPage> {
  const where = { productId, ...APPROVED_WHERE }
  const [rows, total] = await Promise.all([
    db.review.findMany({
      where,
      select: PUBLIC_REVIEW_SELECT,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.review.count({ where }),
  ])
  return {
    reviews: rows.map(toPublicReview),
    total,
    page,
    perPage,
    hasMore: page * perPage < total,
  }
}

const fetchProductReviewsCached = cachedQuery(fetchProductReviews, ['product-reviews'], {
  ...CACHE_OPTIONS,
  revive: (raw) => ({ ...raw, reviews: raw.reviews.map(revivePublic) }),
})

const getProductReviewsByKey = cache((productId: string, page: number, perPage: number) =>
  fetchProductReviewsCached(productId, page, perPage),
)

/** Reseñas aprobadas de un producto, de la más reciente a la más antigua. */
export function getProductReviews(
  productId: string,
  { page = 1, perPage = PRODUCT_REVIEWS_PER_PAGE }: { page?: number; perPage?: number } = {},
): Promise<ProductReviewsPage> {
  const safePage = Number.isInteger(page) && page > 0 ? Math.min(page, 1000) : 1
  const safePerPage =
    Number.isInteger(perPage) && perPage > 0 ? Math.min(perPage, MAX_PER_PAGE) : PRODUCT_REVIEWS_PER_PAGE
  return getProductReviewsByKey(productId, safePage, safePerPage)
}

// ── Inicio ──────────────────────────────────────────────────────────────────

async function fetchHomeReviews(limit: number): Promise<HomeReview[]> {
  const rows = await db.review.findMany({
    where: { ...APPROVED_WHERE, rating: { gte: 4 } },
    select: {
      ...PUBLIC_REVIEW_SELECT,
      product: {
        select: {
          name: true,
          slug: true,
          images: { select: { url: true, alt: true }, orderBy: { position: 'asc' }, take: 1 },
        },
      },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit,
  })
  return rows.map(({ product, ...r }) => ({
    ...toPublicReview(r),
    product: {
      name: product.name,
      slug: product.slug,
      imageUrl: product.images[0]?.url ?? null,
      imageAlt: product.images[0]?.alt ?? null,
    },
  }))
}

const fetchHomeReviewsCached = cachedQuery(fetchHomeReviews, ['home-reviews'], {
  ...CACHE_OPTIONS,
  revive: (raw) => raw.map(revivePublic),
})

/** Reseñas recientes de 4-5 estrellas con su producto, para el inicio. */
export const getHomeReviews = cache((limit: number = 6) =>
  fetchHomeReviewsCached(Math.min(Math.max(Math.trunc(limit) || 6, 1), 12)),
)

async function fetchStoreReviewSummary(): Promise<StoreReviewSummary> {
  const agg = await db.review.aggregate({
    where: APPROVED_WHERE,
    _avg: { rating: true },
    _count: { _all: true },
  })
  const count = agg._count._all
  return { average: count > 0 ? roundAverage(agg._avg.rating ?? 0) : 0, count }
}

/** Promedio y total de todas las reseñas aprobadas de la tienda. */
export const getStoreReviewSummary = cache(
  cachedQuery(fetchStoreReviewSummary, ['store-review-summary'], CACHE_OPTIONS),
)
