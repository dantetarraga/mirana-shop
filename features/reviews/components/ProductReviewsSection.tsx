import { auth } from '@/auth'
import { getMyReview } from '@/features/reviews/actions/review.actions'
import { ReviewForm } from '@/features/reviews/components/ReviewForm'
import { ReviewList } from '@/features/reviews/components/ReviewList'
import { ReviewLoginPrompt } from '@/features/reviews/components/ReviewLoginPrompt'
import { ReviewSummaryPanel } from '@/features/reviews/components/ReviewSummaryPanel'
import { serializePublicReview } from '@/features/reviews/lib/serialize-review'
import {
  getProductReviews,
  getProductReviewSummary,
} from '@/features/reviews/queries/review.queries'

interface ProductReviewsSectionProps {
  productId: string
  productSlug: string
  productName: string
}

export const PRODUCT_REVIEWS_ANCHOR = 'opiniones'

/**
 * Opiniones del PDP (Server Component). Pensado para ir dentro de un
 * <Suspense fallback={<ProductReviewsSkeleton />}>: lee la sesión, así que no
 * debe bloquear el HTML de la ficha.
 *
 * Solo se muestran reseñas APROBADAS. La propia (en cualquier estado) se lee
 * aparte y sin caché para mostrarle al autor si sigue en revisión.
 */
export async function ProductReviewsSection({
  productId,
  productSlug,
  productName,
}: ProductReviewsSectionProps) {
  const [summary, firstPage, session] = await Promise.all([
    getProductReviewSummary(productId),
    getProductReviews(productId, { page: 1 }),
    auth(),
  ])
  const isLoggedIn = Boolean(session?.user?.email)
  const myReview = isLoggedIn ? await getMyReview(productId) : null
  const hasReviews = summary.count > 0 && firstPage.reviews.length > 0

  const composer = isLoggedIn ? (
    <ReviewForm
      productId={productId}
      productName={productName}
      initialReview={myReview}
      intro={hasReviews}
    />
  ) : (
    <ReviewLoginPrompt />
  )

  return (
    <section
      id={PRODUCT_REVIEWS_ANCHOR}
      aria-labelledby="product-reviews-heading"
      data-product={productSlug}
      className="px-4 sm:px-6 py-10 sm:py-16 border-t border-(--bd) scroll-mt-24"
    >
      <div className="max-w-360 mx-auto">
        <h2
          id="product-reviews-heading"
          className="font-display font-black uppercase tracking-[-1px] leading-[0.95] text-[clamp(28px,4vw,48px)] mb-8 sm:mb-10"
        >
          Opiniones
        </h2>

        {hasReviews ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            <div className="lg:col-span-4 lg:sticky lg:top-28 flex flex-col gap-8">
              <ReviewSummaryPanel summary={summary} />
              <div className="pt-8 border-t border-(--bd)">{composer}</div>
            </div>
            <div className="lg:col-span-8">
              <ReviewList
                productId={productId}
                initialReviews={firstPage.reviews.map(serializePublicReview)}
                initialHasMore={firstPage.hasMore}
                total={firstPage.total}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
            <p className="lg:col-span-5 text-[18px] sm:text-[20px] leading-snug text-text max-w-[34ch]">
              Aún no hay opiniones de este producto. ¿Lo tienes? Cuéntanos qué te pareció.
            </p>
            <div className="lg:col-span-7 max-w-2xl">{composer}</div>
          </div>
        )}
      </div>
    </section>
  )
}
