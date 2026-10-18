import 'server-only'

import type { AdminReviewFilters, AdminReviewRow } from '@/features/reviews/types'
import { ADMIN_PER_PAGE } from '@/shared/lib/admin/pagination'
import { db } from '@/shared/lib/db'
import { verifyAdmin } from '@/shared/lib/require-admin'
import { cache } from 'react'

// ---------------------------------------------------------------------------
// Moderación de reseñas (admin). Sin caché de datos: el admin siempre ve el
// estado vigente. Cada lectura pasa por verifyAdmin (deduplicado por request).
// ---------------------------------------------------------------------------

function buildWhere({ status, q }: Pick<AdminReviewFilters, 'status' | 'q'>) {
  const search = q?.trim().slice(0, 100)
  return {
    status,
    ...(search
      ? {
          OR: [
            { title: { contains: search } },
            { body: { contains: search } },
            { product: { name: { contains: search } } },
            { user: { name: { contains: search } } },
            { user: { email: { contains: search } } },
          ],
        }
      : {}),
  }
}

export async function getAdminReviews(
  filters: AdminReviewFilters,
): Promise<{ rows: AdminReviewRow[]; total: number }> {
  await verifyAdmin()
  const perPage = filters.perPage ?? ADMIN_PER_PAGE
  const where = buildWhere(filters)
  const [rows, total] = await Promise.all([
    db.review.findMany({
      where,
      select: {
        id: true,
        rating: true,
        title: true,
        body: true,
        status: true,
        verifiedPurchase: true,
        createdAt: true,
        moderatedAt: true,
        product: { select: { id: true, name: true, slug: true, deletedAt: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      // Pendientes: la más antigua primero (cola de moderación). El resto: recientes.
      orderBy:
        filters.status === 'PENDING'
          ? [{ updatedAt: 'asc' }, { id: 'asc' }]
          : [{ moderatedAt: 'desc' }, { id: 'desc' }],
      skip: (Math.max(filters.page, 1) - 1) * perPage,
      take: perPage,
    }),
    db.review.count({ where }),
  ])
  return { rows, total }
}

/** Reseñas esperando moderación (badge del sidebar y pestaña). */
export const countPendingReviews = cache(async (): Promise<number> => {
  await verifyAdmin()
  return db.review.count({ where: { status: 'PENDING' } })
})

/** Conteo por estado para las pestañas. */
export const countReviewsByStatus = cache(
  async (): Promise<Record<AdminReviewFilters['status'], number>> => {
    await verifyAdmin()
    const rows = await db.review.groupBy({ by: ['status'], _count: { _all: true } })
    const counts = { PENDING: 0, APPROVED: 0, REJECTED: 0 }
    for (const r of rows) counts[r.status] = r._count._all
    return counts
  },
)
