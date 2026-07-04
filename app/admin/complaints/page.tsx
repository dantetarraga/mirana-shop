import { ComplaintsClient, type SerializedComplaint } from '@/features/complaints/components/ComplaintsClient'
import { countComplaints, getComplaints, getComplaintStats } from '@/features/complaints/queries/complaint.queries'
import type { ComplaintFilters } from '@/features/complaints/types'
import { KpiCard } from '@/features/dashboard/components/KpiCard'
import { ServerSearchForm } from '@/shared/components/admin/ServerSearchForm'
import { cn } from '@/shared/lib/utils'

const PER_PAGE = 30

const VALID_STATUSES = new Set(['PENDING', 'ANSWERED'])

function toStatus(v: string | undefined): ComplaintFilters['status'] {
  return v && VALID_STATUSES.has(v) ? (v as ComplaintFilters['status']) : undefined
}

const FILTER_TABS = [
  { key: '', label: 'Todos' },
  { key: 'PENDING', label: 'Pendientes' },
  { key: 'ANSWERED', label: 'Respondidos' },
]

function buildUrl(params: Record<string, string | undefined>) {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v) p.set(k, v)
  }
  const qs = p.toString()
  return qs ? `/admin/complaints?${qs}` : '/admin/complaints'
}

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}

export default async function ComplaintsPage({ searchParams }: PageProps) {
  const { q, status: rawStatus, page: rawPage } = await searchParams
  const status = toStatus(rawStatus)
  const page = Math.max(1, Number(rawPage ?? 1))
  const skip = (page - 1) * PER_PAGE

  const [complaints, stats, total] = await Promise.all([
    getComplaints({ search: q, status, take: PER_PAGE, skip }),
    getComplaintStats(),
    countComplaints({ search: q, status }),
  ])

  const serialized: SerializedComplaint[] = complaints.map((c) => ({
    ...c,
    claimedAmount: c.claimedAmount != null ? Number(c.claimedAmount) : null,
  }))

  const totalPages = Math.ceil(total / PER_PAGE)
  const currentQ = q ?? ''
  const currentStatus = rawStatus ?? ''

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-5 lg:pt-7 pb-12">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <KpiCard label="Total reclamos" value={stats.total} valueClass="text-text" />
        <KpiCard label="Pendientes" value={stats.pending} valueClass="text-[#ffb84a]" />
        <KpiCard label="Respondidos" value={stats.answered} valueClass="text-[#3fcf7f]" />
      </div>

      {/* Filtros server-side */}
      <div className="flex items-center gap-3.5 flex-wrap mb-4">
        <ServerSearchForm
          placeholder="Buscar código, cliente o correo..."
          defaultValue={currentQ}
          paramName="q"
          extraParams={currentStatus ? { status: currentStatus } : {}}
        />
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_TABS.map(({ key, label }) => {
            const isActive = key === currentStatus
            const href = buildUrl({ q: currentQ || undefined, status: key || undefined })
            return (
              <a
                key={key}
                href={href}
                className={cn(
                  'px-3.5 py-2 text-[11px] tracking-[1px] uppercase font-display font-extrabold border transition-colors',
                  isActive
                    ? 'bg-(--gold) border-(--gold) text-black'
                    : 'border-(--bd) text-muted hover:text-text hover:border-(--bd)',
                )}
              >
                {label}
              </a>
            )
          })}
        </div>
        {(currentQ || currentStatus) && (
          <a href="/admin/complaints" className="text-[12px] text-muted hover:text-text transition-colors">
            Limpiar
          </a>
        )}
      </div>

      <ComplaintsClient complaints={serialized} />

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex flex-wrap gap-2 justify-end mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={buildUrl({
                q: currentQ || undefined,
                status: currentStatus || undefined,
                page: String(p),
              })}
              className={cn(
                'px-3 py-1.5 text-[13px] border transition-colors',
                p === page
                  ? 'bg-(--gold) border-(--gold) text-black font-bold'
                  : 'border-(--bd) text-muted hover:text-text',
              )}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
