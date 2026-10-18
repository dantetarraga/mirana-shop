'use client'

import { approveReview, deleteReview, rejectReview } from '@/features/reviews/actions/admin-review.actions'
import { VerifiedBadge } from '@/features/reviews/components/ReviewItem'
import { ReviewStars } from '@/features/reviews/components/ReviewStars'
import type { ReviewStatusValue } from '@/features/reviews/schemas/review.schema'
import { AdminTable, type Column } from '@/shared/components/admin/AdminTable'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal'
import { EmptyState } from '@/shared/components/ui/EmptyState'
import { useServerAction } from '@/shared/hooks/useServerAction'
import { cls } from '@/shared/lib/admin/admin-classes'
import { Check, ExternalLink, MessageSquareText, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'

export interface SerializedAdminReview {
  id: string
  rating: number
  title: string | null
  body: string
  status: ReviewStatusValue
  verifiedPurchase: boolean
  createdLabel: string
  moderatedLabel: string | null
  product: { name: string; slug: string; deleted: boolean }
  author: { name: string | null; email: string }
}

const EXCERPT = 140

const EMPTY_COPY: Record<ReviewStatusValue, { title: string; description: string }> = {
  PENDING: {
    title: 'Nada por revisar',
    description: 'Las opiniones nuevas o editadas aparecen aquí hasta que las apruebes o rechaces.',
  },
  APPROVED: {
    title: 'Aún no hay opiniones publicadas',
    description: 'Aprueba opiniones desde la pestaña Pendientes para mostrarlas en la tienda.',
  },
  REJECTED: {
    title: 'No hay opiniones rechazadas',
    description: 'Las opiniones que rechaces quedan aquí y no se muestran en la tienda.',
  },
}

function ReviewText({ review }: { review: SerializedAdminReview }) {
  const [open, setOpen] = useState(false)
  const long = review.body.length > EXCERPT
  const text = open || !long ? review.body : `${review.body.slice(0, EXCERPT).trimEnd()}…`
  return (
    <div className="max-w-md whitespace-normal">
      {review.title && <div className="font-semibold text-[14px] mb-0.5 wrap-break-word">{review.title}</div>}
      <p id={`review-body-${review.id}`} className="text-[13px] text-muted whitespace-pre-line wrap-break-word">
        {text}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={`review-body-${review.id}`}
          className="mt-1 text-[12px] font-semibold text-accent-ink underline underline-offset-2 hover:no-underline"
        >
          {open ? 'Ver menos' : 'Ver completa'}
        </button>
      )}
    </div>
  )
}

export function AdminReviewsClient({
  reviews,
  status,
}: {
  reviews: SerializedAdminReview[]
  status: ReviewStatusValue
}) {
  const { isPending, run } = useServerAction()
  const [busy, setBusy] = useState<{ id: string; action: 'approve' | 'reject' | 'delete' } | null>(null)
  const [toDelete, setToDelete] = useState<SerializedAdminReview | null>(null)

  const columns = useMemo<Column<SerializedAdminReview>[]>(() => {
    const act = (review: SerializedAdminReview, action: 'approve' | 'reject') => {
      setBusy({ id: review.id, action })
      run(() => (action === 'approve' ? approveReview : rejectReview)({ reviewId: review.id }), {
        successMsg: action === 'approve' ? 'Opinión publicada' : 'Opinión rechazada',
        refresh: true,
        onSuccess: () => setBusy(null),
      })
    }
    const loading = (id: string, action: 'approve' | 'reject') =>
      isPending && busy?.id === id && busy.action === action

    return [
      {
        header: 'Calificación',
        className: 'whitespace-nowrap',
        render: (r) => <ReviewStars value={r.rating} size={13} />,
      },
      {
        header: 'Opinión',
        render: (r) => <ReviewText review={r} />,
      },
      {
        header: 'Producto',
        render: (r) =>
          r.product.deleted ? (
            <span className="text-[13px] text-muted">{r.product.name} (eliminado)</span>
          ) : (
            <a
              href={`/catalogo/${r.product.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[13px] text-accent-ink underline underline-offset-2 hover:no-underline max-w-56"
            >
              <span className="line-clamp-2">{r.product.name}</span>
              <ExternalLink size={12} aria-hidden className="shrink-0" />
              <span className="sr-only">(se abre en otra pestaña)</span>
            </a>
          ),
      },
      {
        header: 'Autor',
        render: (r) => (
          <>
            <div className="text-[14px] font-semibold">{r.author.name || 'Sin nombre'}</div>
            <div className="text-[12px] text-muted">{r.author.email}</div>
            {r.verifiedPurchase && <VerifiedBadge className="mt-1" />}
          </>
        ),
      },
      {
        header: 'Fecha',
        className: 'text-[13px] text-muted whitespace-nowrap',
        render: (r) => (
          <>
            <div>{r.createdLabel}</div>
            {r.moderatedLabel && <div className="text-[11px]">Moderada {r.moderatedLabel}</div>}
          </>
        ),
      },
      {
        header: 'Acciones',
        headerClassName: 'text-right',
        className: 'text-right whitespace-nowrap',
        render: (r) => (
          <div className="inline-flex gap-1.5 justify-end">
            {r.status !== 'APPROVED' && (
              <Button
                size="sm"
                variant="accent"
                loading={loading(r.id, 'approve')}
                disabled={isPending}
                onClick={() => act(r, 'approve')}
                aria-label={`Aprobar opinión de ${r.author.name || r.author.email}`}
              >
                <Check size={14} aria-hidden />
                Aprobar
              </Button>
            )}
            {r.status !== 'REJECTED' && (
              <Button
                size="sm"
                variant="outline"
                loading={loading(r.id, 'reject')}
                disabled={isPending}
                onClick={() => act(r, 'reject')}
                aria-label={`Rechazar opinión de ${r.author.name || r.author.email}`}
              >
                <X size={14} aria-hidden />
                Rechazar
              </Button>
            )}
            <Button
              size="sm"
              variant="icon"
              destructive
              disabled={isPending}
              onClick={() => setToDelete(r)}
              aria-label={`Eliminar opinión de ${r.author.name || r.author.email}`}
            >
              <Trash2 size={15} aria-hidden />
            </Button>
          </div>
        ),
      },
    ]
  }, [busy, isPending, run])

  if (reviews.length === 0) {
    const copy = EMPTY_COPY[status]
    return (
      <div className={cls.panelTable}>
        <EmptyState icon={MessageSquareText} title={copy.title} description={copy.description} />
      </div>
    )
  }

  return (
    <>
      <AdminTable columns={columns} data={reviews} keyExtractor={(r) => r.id} />
      <ConfirmModal
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title="Eliminar opinión"
        description="Se borra para siempre y no se puede recuperar. Si solo quieres ocultarla de la tienda, recházala."
        confirmLabel="Eliminar opinión"
        isPending={isPending && busy?.action === 'delete'}
        onConfirm={() => {
          if (!toDelete) return
          const id = toDelete.id
          setBusy({ id, action: 'delete' })
          run(() => deleteReview({ reviewId: id }), {
            successMsg: 'Opinión eliminada',
            refresh: true,
            onSuccess: () => {
              setToDelete(null)
              setBusy(null)
            },
          })
        }}
      />
    </>
  )
}
