import { cn } from '@/shared/lib/utils'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

// ---------------------------------------------------------------------------
// Estado vacío único — carrito, búsqueda sin resultados, filtros del catálogo,
// pedidos/direcciones de la cuenta y tablas del admin.
//
// El icono va en un marco con las esquinas recortadas (el mismo corte que
// `.ui-btn--clip`, el motivo de la marca) en vez del icono gigante al 20 % de
// opacidad que había en cada pantalla. El texto dice qué pasa y la acción
// dice cómo salir de ahí: un vacío es una invitación a actuar.
// ---------------------------------------------------------------------------

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: ReactNode
  /** CTA — normalmente un <Link className={buttonClass(...)}> o un <Button> */
  action?: ReactNode
  /** page: pantalla completa (carrito, catálogo). compact: tablas y paneles. */
  size?: 'page' | 'compact'
  /** Nivel del título. En `page` suele ser el h1 de la pantalla. */
  as?: 'h1' | 'h2' | 'h3' | 'p'
  className?: string
}

const CLIP =
  'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  size = 'compact',
  as: Heading = size === 'page' ? 'h1' : 'p',
  className,
}: EmptyStateProps) {
  const page = size === 'page'
  return (
    <div
      className={cn(
        'flex flex-col items-center text-center',
        page ? 'gap-5 py-20 px-5' : 'gap-3 py-12 px-5',
        className,
      )}
    >
      {/* Marco: borde de 1px dibujado como fondo + recorte, para que el corte
          diagonal también tenga línea (border + clip-path la pierde). */}
      <div
        aria-hidden
        className={cn('grid place-items-center bg-border-gold', page ? 'size-18' : 'size-13')}
        style={{ clipPath: CLIP }}
      >
        <div
          className="size-[calc(100%-2px)] grid place-items-center bg-surf text-accent-ink"
          style={{ clipPath: CLIP }}
        >
          <Icon size={page ? 28 : 22} strokeWidth={1.5} />
        </div>
      </div>
      <div className="max-w-sm">
        <Heading
          className={cn(
            'font-display font-black uppercase tracking-tight text-text',
            page ? 'text-[28px] sm:text-[32px] leading-none mb-2' : 'text-[18px] leading-tight mb-1',
          )}
        >
          {title}
        </Heading>
        {description && (
          <p className={cn('text-muted', page ? 'text-[14px]' : 'text-[13px]')}>{description}</p>
        )}
      </div>
      {action && <div className={page ? 'mt-1' : ''}>{action}</div>}
    </div>
  )
}
