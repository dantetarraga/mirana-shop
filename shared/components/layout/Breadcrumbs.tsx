import { cn } from '@/shared/lib/utils'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

export interface BreadcrumbItem {
  label: string
  /** Sin href = página actual (último elemento). */
  href?: string
}

/**
 * Migas de pan de la tienda (ficha, categoría, marca, colección). El último
 * elemento es la página actual: sin enlace y con aria-current.
 */
export function Breadcrumbs({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <nav aria-label="Migas de pan" className={cn('mb-6 sm:mb-8', className)}>
      <ol className="flex flex-wrap items-center gap-1.5 text-[11px] tracking-[1.5px] uppercase text-muted">
        {items.map((item, i) => {
          const last = i === items.length - 1
          return (
            <li key={`${item.label}-${i}`} className={cn('flex items-center gap-1.5', last && 'min-w-0')}>
              {item.href && !last ? (
                <Link href={item.href} className="hover:text-text transition-colors py-1">
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="text-text block truncate max-w-[200px] sm:max-w-none">
                  {item.label}
                </span>
              )}
              {!last && <ChevronRight size={12} aria-hidden className="shrink-0" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/** JSON-LD BreadcrumbList a partir de las mismas migas (URLs absolutas). */
export function breadcrumbJsonLd(siteUrl: string, items: { label: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      item: item.path === '/' ? siteUrl : `${siteUrl}${item.path}`,
    })),
  }
}
