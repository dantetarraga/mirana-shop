import { VerifiedBadge } from '@/features/reviews/components/ReviewItem'
import { ReviewStars } from '@/features/reviews/components/ReviewStars'
import { formatAverage } from '@/features/reviews/lib/review-summary'
import { getHomeReviews, getStoreReviewSummary } from '@/features/reviews/queries/review.queries'
import type { HomeReview } from '@/features/reviews/types'
import Image from 'next/image'
import Link from 'next/link'

/**
 * Opiniones reales en el inicio. Si no hay ninguna aprobada la sección no se
 * pinta (devuelve null): nunca se rellena con testimonios inventados.
 *
 * Móvil: fila horizontal con scroll-snap (una tarjeta y media a la vista).
 * Desde `sm`: rejilla de 2 y luego 3 columnas.
 */
export async function ReviewsSection() {
  const [reviews, summary] = await Promise.all([getHomeReviews(6), getStoreReviewSummary()])
  if (reviews.length === 0 || summary.count === 0) return null

  return (
    <section aria-labelledby="home-reviews-title" className="shell py-14 md:py-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-7 md:mb-10">
        <h2
          id="home-reviews-title"
          className="font-display font-black uppercase tracking-[-1px] leading-[0.95] text-[clamp(32px,5vw,64px)] max-w-[16ch]"
        >
          Lo que dicen nuestros coleccionistas
        </h2>
        <div className="flex items-center gap-3.5 shrink-0">
          <p className="font-display font-black leading-none tracking-[-1.5px] text-[clamp(48px,6vw,72px)]">
            <span className="sr-only">Calificación promedio: </span>
            {formatAverage(summary.average)}
            <span className="sr-only"> de 5</span>
          </p>
          <div className="flex flex-col gap-1">
            <ReviewStars value={summary.average} size={16} />
            <p className="text-[13px] text-muted">
              Basado en {summary.count} {summary.count === 1 ? 'opinión' : 'opiniones'}
            </p>
          </div>
        </div>
      </div>

      <ul
        aria-label="Opiniones de clientes"
        // Región desplazable en móvil: enfocable para poder recorrerla con flechas.
        tabIndex={0}
        className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-px-4 pb-2 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-5 sm:overflow-visible outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {reviews.map((r) => (
          <li key={r.id} className="snap-start shrink-0 w-[82%] sm:w-auto flex">
            <HomeReviewCard review={r} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function HomeReviewCard({ review }: { review: HomeReview }) {
  return (
    <article className="flex flex-col w-full bg-card border border-(--bd) border-l-2 border-l-(--gold) p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
        <ReviewStars value={review.rating} />
        {review.verifiedPurchase && <VerifiedBadge />}
      </div>
      {review.title && (
        <h3 className="text-[16px] font-bold leading-snug text-text mb-1.5 line-clamp-2 wrap-break-word">
          {review.title}
        </h3>
      )}
      <p className="text-[14px] leading-relaxed text-text/90 line-clamp-5 wrap-break-word">{review.body}</p>
      <p className="mt-3 text-[13px] font-semibold text-text">{review.authorName}</p>

      <div className="mt-auto pt-5">
        <Link
          href={`/catalogo/${review.product.slug}`}
          className="group flex items-center gap-3 pt-4 border-t border-(--bd) no-underline"
        >
          <span className="relative size-12 shrink-0 overflow-hidden bg-skeleton border border-(--bd)">
            {review.product.imageUrl && (
              <Image
                src={review.product.imageUrl}
                alt=""
                fill
                sizes="48px"
                className="object-cover"
              />
            )}
          </span>
          <span className="text-[13px] leading-snug text-muted group-hover:text-text transition-colors line-clamp-2">
            <span className="sr-only">Ver producto: </span>
            {review.product.name}
          </span>
        </Link>
      </div>
    </article>
  )
}
