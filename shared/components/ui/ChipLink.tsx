import { cn } from '@/shared/lib/utils'
import Link from 'next/link'
import type { ReactNode } from 'react'

// ---------------------------------------------------------------------------
// Chip-enlace de la tienda: accesos rápidos del inicio, subcategorías de
// /categorias/[slug] y categorías de /marcas/[slug]. 40 px de alto (objetivo
// táctil), esquinas rectas como el resto de la marca, sin dropdowns.
// ---------------------------------------------------------------------------

interface ChipLinkProps {
  href: string
  children: ReactNode
  /** Página/filtro actual: relleno cyan y aria-current. */
  active?: boolean
  /** Acceso destacado (preventas, ofertas): texto y borde del acento. */
  accent?: boolean
  count?: number
  className?: string
}

export function ChipLink({ href, children, active, accent, count, className }: ChipLinkProps) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex items-center gap-2 h-10 px-4 shrink-0 border whitespace-nowrap no-underline',
        'font-display text-[13px] font-bold uppercase tracking-[1px] transition-colors duration-150',
        active
          ? 'bg-(--gold) border-(--gold) text-on-accent'
          : accent
            ? 'border-(--bdh) text-accent-ink hover:bg-(--gd)'
            : 'border-(--bd) text-text hover:border-(--bdh) hover:text-accent-ink',
        className,
      )}
    >
      {children}
      {count != null && (
        <span className={cn('font-sans text-[11px] font-semibold tabular-nums', !active && 'text-muted')}>
          {count}
        </span>
      )}
    </Link>
  )
}

/** Fila de chips: envuelve en desktop y se desliza en horizontal en móvil. */
export function ChipRow({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <nav aria-label={label} className={className}>
      <ul className="flex gap-2 overflow-x-auto sm:flex-wrap -mx-4 px-4 sm:mx-0 sm:px-0 pb-1 sm:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x scroll-px-4">
        {children}
      </ul>
    </nav>
  )
}
