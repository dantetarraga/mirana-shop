import { ReviewStars } from '@/features/reviews/components/ReviewStars'
import type { SerializedPublicReview } from '@/features/reviews/types'
import { cn } from '@/shared/lib/utils'
import { BadgeCheck } from 'lucide-react'
import type { Ref } from 'react'

/** Insignia de compra verificada: el autor tenía un pedido pagado del producto. */
export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-[12px] font-semibold text-success', className)}>
      <BadgeCheck size={14} strokeWidth={2} aria-hidden />
      Compra verificada
    </span>
  )
}

/**
 * Una reseña en la lista del PDP. Sin tarjeta: filas separadas por una línea,
 * para que la lista se lea como conversación y no como un mosaico de cajas.
 * El texto es plano y React lo escapa; los saltos de línea se respetan.
 */
export function ReviewItem({
  review,
  ref,
}: {
  review: SerializedPublicReview
  ref?: Ref<HTMLElement>
}) {
  return (
    <article
      ref={ref}
      tabIndex={ref ? -1 : undefined}
      aria-label={`Opinión de ${review.authorName}`}
      className="py-6 border-t border-(--bd) first:border-t-0 first:pt-0 outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2.5">
        <ReviewStars value={review.rating} />
        {review.verifiedPurchase && <VerifiedBadge />}
      </div>
      {review.title && (
        <h3 className="text-[16px] font-bold leading-snug text-text mb-1.5 wrap-break-word">
          {review.title}
        </h3>
      )}
      <p className="text-[14px] leading-relaxed text-text/90 whitespace-pre-line wrap-break-word max-w-[68ch]">
        {review.body}
      </p>
      <p className="mt-3 text-[12px] text-muted">
        <span className="font-semibold text-text">{review.authorName}</span>
        <span aria-hidden>, </span>
        <time dateTime={review.createdAt}>{review.dateLabel}</time>
      </p>
    </article>
  )
}
