'use client'

import { loadProductReviews } from '@/features/reviews/actions/review.actions'
import { ReviewItem } from '@/features/reviews/components/ReviewItem'
import type { SerializedPublicReview } from '@/features/reviews/types'
import { Button } from '@/shared/components/ui/Button'
import { useEffect, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

interface ReviewListProps {
  productId: string
  initialReviews: SerializedPublicReview[]
  initialHasMore: boolean
  total: number
}

/**
 * Lista de reseñas aprobadas con "Ver más". La primera página llega renderizada
 * desde el servidor; las siguientes se piden a una action (lectura cacheada).
 * Al cargar, el foco pasa a la primera reseña nueva para que el teclado y el
 * lector de pantalla sigan donde estaban.
 */
export function ReviewList({ productId, initialReviews, initialHasMore, total }: ReviewListProps) {
  const [reviews, setReviews] = useState(initialReviews)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [page, setPage] = useState(1)
  const [focusId, setFocusId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const firstNewRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (focusId) firstNewRef.current?.focus()
  }, [focusId])

  const loadMore = () => {
    startTransition(async () => {
      const next = page + 1
      const result = await loadProductReviews(productId, next).catch(() => null)
      if (!result || !result.success) {
        toast.error(result && !result.success ? result.error : 'No se pudieron cargar más opiniones.')
        return
      }
      const seen = new Set(reviews.map((r) => r.id))
      const fresh = result.data.reviews.filter((r) => !seen.has(r.id))
      setReviews((prev) => [...prev, ...fresh])
      setHasMore(result.data.hasMore)
      setPage(next)
      setFocusId(fresh[0]?.id ?? null)
    })
  }

  return (
    <div>
      <div>
        {reviews.map((r) => (
          <ReviewItem key={r.id} review={r} ref={r.id === focusId ? firstNewRef : undefined} />
        ))}
      </div>
      {hasMore && (
        <div className="pt-6 border-t border-(--bd) flex flex-wrap items-center gap-4">
          <Button variant="outline" size="md" loading={isPending} onClick={loadMore}>
            Ver más opiniones
          </Button>
          <span className="text-[12px] text-muted">
            Mostrando {reviews.length} de {total}
          </span>
        </div>
      )}
    </div>
  )
}
