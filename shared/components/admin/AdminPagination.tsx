import { cn } from '@/shared/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

// ---------------------------------------------------------------------------
// Paginación server-side compartida por las tablas del admin. Server Component:
// `buildHref` se ejecuta en el servidor al renderizar los enlaces.
//
// Con muchas páginas no se listan todas — se muestra una ventana alrededor de
// la actual, con la primera y la última siempre visibles.
// ---------------------------------------------------------------------------

interface AdminPaginationProps {
  page: number
  totalPages: number
  /** URL de cada página, conservando búsqueda y filtros activos. */
  buildHref: (page: number) => string
  /** Total de registros — si se pasa junto con perPage, muestra "1–30 de 214". */
  total?: number
  perPage?: number
  className?: string
}

/** Páginas visibles: 1, …, page-1, page, page+1, …, totalPages */
function pageWindow(page: number, totalPages: number): (number | 'gap')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)

  const pages = new Set([1, totalPages, page, page - 1, page + 1])
  if (page <= 3) pages.add(2).add(3).add(4)
  if (page >= totalPages - 2) pages.add(totalPages - 1).add(totalPages - 2).add(totalPages - 3)

  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)

  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? ['gap' as const, p] : [p]))
}

const linkBase =
  'min-w-9 px-3 py-1.5 text-[13px] border transition-colors inline-flex items-center justify-center'

export function AdminPagination({
  page,
  totalPages,
  buildHref,
  total,
  perPage,
  className,
}: AdminPaginationProps) {
  if (totalPages <= 1) return null

  const from = perPage ? (page - 1) * perPage + 1 : null
  const to = perPage && total != null ? Math.min(page * perPage, total) : null

  return (
    <nav
      aria-label="Paginación"
      className={cn('flex items-center gap-2 flex-wrap justify-end', className)}
    >
      {from !== null && to !== null && total != null && (
        <span className="text-[12px] text-muted mr-auto">
          {from}–{to} de {total}
        </span>
      )}

      <Link
        href={buildHref(Math.max(1, page - 1))}
        aria-label="Página anterior"
        aria-disabled={page === 1}
        tabIndex={page === 1 ? -1 : undefined}
        className={cn(
          linkBase,
          'border-(--bd) text-muted hover:text-text',
          page === 1 && 'opacity-30 pointer-events-none',
        )}
      >
        <ChevronLeft size={14} />
      </Link>

      {pageWindow(page, totalPages).map((p, i) =>
        p === 'gap' ? (
          <span key={`gap-${i}`} className="text-[13px] text-muted px-1" aria-hidden>
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildHref(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              linkBase,
              p === page
                ? 'bg-(--gold) border-(--gold) text-black font-bold'
                : 'border-(--bd) text-muted hover:text-text',
            )}
          >
            {p}
          </Link>
        ),
      )}

      <Link
        href={buildHref(Math.min(totalPages, page + 1))}
        aria-label="Página siguiente"
        aria-disabled={page === totalPages}
        tabIndex={page === totalPages ? -1 : undefined}
        className={cn(
          linkBase,
          'border-(--bd) text-muted hover:text-text',
          page === totalPages && 'opacity-30 pointer-events-none',
        )}
      >
        <ChevronRight size={14} />
      </Link>
    </nav>
  )
}
