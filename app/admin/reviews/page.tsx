import {
  AdminReviewsClient,
  type SerializedAdminReview,
} from '@/features/reviews/components/AdminReviewsClient'
import { ADMIN_REVIEW_TABS } from '@/features/reviews/lib/review-status'
import { getAdminReviews, countReviewsByStatus } from '@/features/reviews/queries/admin-review.queries'
import { REVIEW_STATUSES, type ReviewStatusValue } from '@/features/reviews/schemas/review.schema'
import { AdminPagination } from '@/shared/components/admin/AdminPagination'
import { ServerSearchForm } from '@/shared/components/admin/ServerSearchForm'
import { ADMIN_PER_PAGE, parsePage } from '@/shared/lib/admin/pagination'
import { Dates } from '@/shared/lib/dates'
import { verifyAdmin } from '@/shared/lib/require-admin'
import { cn } from '@/shared/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Reseñas' }

const PER_PAGE = ADMIN_PER_PAGE

function toStatus(v: string | undefined): ReviewStatusValue {
  return v && (REVIEW_STATUSES as readonly string[]).includes(v) ? (v as ReviewStatusValue) : 'PENDING'
}

function buildUrl(params: Record<string, string | undefined>) {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v) p.set(k, v)
  }
  const qs = p.toString()
  return qs ? `/admin/reviews?${qs}` : '/admin/reviews'
}

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}

export default async function AdminReviewsPage({ searchParams }: PageProps) {
  await verifyAdmin()
  const { q, status: rawStatus, page: rawPage } = await searchParams
  const status = toStatus(rawStatus)
  const page = parsePage(rawPage)
  const currentQ = q?.trim() ?? ''

  const [{ rows, total }, counts] = await Promise.all([
    getAdminReviews({ status, page, q: currentQ || undefined, perPage: PER_PAGE }),
    countReviewsByStatus(),
  ])

  const reviews: SerializedAdminReview[] = rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    status: r.status,
    verifiedPurchase: r.verifiedPurchase,
    createdLabel: Dates.format(r.createdAt, 'd MMM yyyy'),
    moderatedLabel: r.moderatedAt ? Dates.format(r.moderatedAt, 'd MMM yyyy') : null,
    product: { name: r.product.name, slug: r.product.slug, deleted: r.product.deletedAt !== null },
    author: { name: r.user.name, email: r.user.email },
  }))

  const totalPages = Math.ceil(total / PER_PAGE)
  const statusParam = status === 'PENDING' ? undefined : status

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-5 lg:pt-7 pb-12">
      <div className="mb-5">
        {/* El título visible lo pone AdminTopbar (TITLES['/admin/reviews']). */}
        <h1 className="sr-only">Reseñas</h1>
        <p className="text-[13px] text-muted max-w-2xl">
          Solo las opiniones aprobadas se muestran en la tienda. Revisa que sean de clientes reales y no
          incluyan datos personales, enlaces o publicidad.
        </p>
      </div>

      <div className="flex items-center gap-3.5 flex-wrap mb-4">
        <ServerSearchForm
          placeholder="Buscar producto, cliente o texto..."
          defaultValue={currentQ}
          paramName="q"
          extraParams={statusParam ? { status: statusParam } : {}}
        />
        <nav aria-label="Estado de las reseñas" className="flex gap-1.5 flex-wrap">
          {ADMIN_REVIEW_TABS.map(({ key, label }) => {
            const isActive = key === status
            return (
              <a
                key={key}
                href={buildUrl({
                  q: currentQ || undefined,
                  status: key === 'PENDING' ? undefined : key,
                })}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center gap-2 px-3.5 py-2 text-[11px] tracking-[1px] uppercase font-display font-extrabold border transition-colors',
                  isActive
                    ? 'bg-(--gold) border-(--gold) text-on-accent'
                    : 'border-(--bd) text-muted hover:text-text',
                )}
              >
                {label}
                <span className="tabular-nums opacity-80">{counts[key]}</span>
              </a>
            )
          })}
        </nav>
        {currentQ && (
          <a
            href={buildUrl({ status: statusParam })}
            className="text-[12px] text-muted hover:text-text transition-colors"
          >
            Limpiar
          </a>
        )}
      </div>

      <AdminReviewsClient key={`${status}-${page}-${currentQ}`} reviews={reviews} status={status} />

      <AdminPagination
        page={page}
        totalPages={totalPages}
        total={total}
        perPage={PER_PAGE}
        className="mt-4"
        buildHref={(p) =>
          buildUrl({ q: currentQ || undefined, status: statusParam, page: String(p) })
        }
      />
    </div>
  )
}
