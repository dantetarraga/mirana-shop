import { buildCatalogUrl, type CatalogUrlParams } from '@/features/products/lib/catalog-url'
import Link from 'next/link'

interface CatalogPaginationProps {
  currentPage: number
  totalPages: number
  baseParams: Omit<CatalogUrlParams, 'page'>
}

function getPageRange(current: number, total: number): (number | '…')[] {
  const pages = new Set<number>([1, total, current, current - 1, current + 1])
  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b)

  const result: (number | '…')[] = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('…')
    result.push(sorted[i])
  }
  return result
}

export function CatalogPagination({ currentPage, totalPages, baseParams }: CatalogPaginationProps) {
  if (totalPages <= 1) return null

  const pageRange = getPageRange(currentPage, totalPages)

  return (
    <div className="flex items-center justify-center gap-1 mt-10">
      <Link
        href={buildCatalogUrl({ ...baseParams, page: Math.max(1, currentPage - 1) })}
        aria-disabled={currentPage === 1}
        className={`w-9.5 h-9.5 border border-(--bd) flex items-center justify-center font-display text-[15px] font-bold transition-colors ${
          currentPage === 1 ? 'text-muted opacity-40 pointer-events-none' : 'text-muted hover:text-text hover:border-muted'
        }`}
      >
        ‹
      </Link>
      {pageRange.map((p, i) =>
        p === '…' ? (
          <span key={`dots-${i}`} className="text-muted px-1 flex items-center">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildCatalogUrl({ ...baseParams, page: p })}
            className={`w-9.5 h-9.5 border flex items-center justify-center font-display text-[15px] font-bold transition-colors ${
              p === currentPage
                ? 'bg-(--gold) border-(--gold) text-black'
                : 'border-(--bd) text-muted hover:text-text hover:border-muted'
            }`}
          >
            {p}
          </Link>
        ),
      )}
      <Link
        href={buildCatalogUrl({ ...baseParams, page: Math.min(totalPages, currentPage + 1) })}
        aria-disabled={currentPage === totalPages}
        className={`w-9.5 h-9.5 border border-(--bd) flex items-center justify-center font-display text-[15px] font-bold transition-colors ${
          currentPage === totalPages ? 'text-muted opacity-40 pointer-events-none' : 'text-muted hover:text-text hover:border-muted'
        }`}
      >
        ›
      </Link>
    </div>
  )
}
