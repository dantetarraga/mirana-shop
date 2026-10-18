import type { ReviewStatusValue } from '@/features/reviews/schemas/review.schema'

/** Estado de la reseña propia, en el lenguaje del cliente. */
export const MY_REVIEW_STATUS: Record<
  ReviewStatusValue,
  { label: string; hint: string; className: string }
> = {
  PENDING: {
    label: 'En revisión',
    hint: 'Se publicará cuando la revisemos.',
    className: 'badge-amber',
  },
  APPROVED: {
    label: 'Publicada',
    hint: 'Ya es visible en la tienda. Si la editas, vuelve a revisión.',
    className: 'badge-green',
  },
  REJECTED: {
    label: 'No publicada',
    hint: 'No cumple las normas de publicación. Puedes editarla y enviarla de nuevo.',
    className: 'badge-red',
  },
}

/** Pestañas del admin. */
export const ADMIN_REVIEW_TABS: { key: ReviewStatusValue; label: string }[] = [
  { key: 'PENDING', label: 'Pendientes' },
  { key: 'APPROVED', label: 'Publicadas' },
  { key: 'REJECTED', label: 'Rechazadas' },
]
