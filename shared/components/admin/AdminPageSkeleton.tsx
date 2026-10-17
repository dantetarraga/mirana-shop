import { Skeleton, SkeletonRegion } from '@/shared/components/ui/Skeleton'
import { cn } from '@/shared/lib/utils'

// ---------------------------------------------------------------------------
// Esqueletos del admin. Cada pieza copia las medidas de su componente real
// para que la página no salte al llegar los datos:
//
//   SkHeader     ↔ PanelHeader (label 10px + título 22px; botón md 43px / sm 36px)
//   SkKpis       ↔ KpiCard (cls.kpi: p-[20px_22px], valor 26/36px leading-none)
//   SkFilters    ↔ ServerSearchForm (h-10.5, flex-1 min-w-50 max-w-85) + tabs
//   SkTable      ↔ AdminTable (th 43px, td py-[13px]; alto de fila por prop)
//   SkPagination ↔ AdminPagination (texto + botones de 36px)
//
// Los bloques miden lo mismo que la caja de línea del texto real (por eso
// algunos llevan margen vertical: un h-2.5 dentro de una línea de 15px).
// ---------------------------------------------------------------------------

/** Padding de las pantallas con KPIs/responsive vs. las de un solo panel. */
const PAD = {
  page: 'px-4 sm:px-6 lg:px-8 pt-5 lg:pt-7 pb-12',
  panel: 'px-8 pt-7 pb-12',
} as const

export function SkHeader({
  actions = 1,
  actionSize = 'md',
}: {
  actions?: number
  actionSize?: 'sm' | 'md'
}) {
  return (
    <div className="flex flex-col sm:flex-row justify-between gap-3 sm:items-center mb-4.5">
      <div>
        {/* label: línea de 15px + mb-1.5 */}
        <Skeleton className="h-2.5 w-20 my-[2.5px] mb-[8.5px]" />
        {/* título 22px: línea de 33px */}
        <Skeleton className="h-6 w-48 my-[4.5px]" />
      </div>
      {actions > 0 && (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: actions }, (_, i) => (
            <Skeleton key={i} className={cn(actionSize === 'md' ? 'h-[43px] w-40' : 'h-9 w-36')} />
          ))}
        </div>
      )}
    </div>
  )
}

export function SkKpis({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6', className)}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="bg-card border border-(--bd) p-[20px_22px]">
          <Skeleton className="h-2.5 w-24 my-[2.5px] mb-[10.5px]" />
          <Skeleton className="h-6.5 sm:h-9 w-20" />
        </div>
      ))}
    </div>
  )
}

export function SkFilters({ tabs = 4, className }: { tabs?: number; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3.5 flex-wrap mb-4', className)}>
      <Skeleton className="h-10.5 flex-1 min-w-50 max-w-85" />
      {tabs > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {Array.from({ length: tabs }, (_, i) => (
            <Skeleton key={i} className="h-8.5 w-24" />
          ))}
        </div>
      )}
    </div>
  )
}

export function SkTable({
  cols = 6,
  rows = 8,
  rowHeight = 'h-12',
}: {
  cols?: number
  rows?: number
  /** Alto de la fila real: h-12 texto simple, h-16.5 nombre + subtítulo, etc. */
  rowHeight?: string
}) {
  return (
    <div className="bg-card border border-(--bd) overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-125">
          <div className="bg-surf border-b border-(--bd) flex items-center gap-4 px-2.5 sm:px-4 h-11">
            {Array.from({ length: cols }, (_, i) => (
              <Skeleton key={i} className="h-2.5 flex-1" />
            ))}
          </div>
          {Array.from({ length: rows }, (_, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-4 px-2.5 sm:px-4 border-b border-(--bd) last:border-b-0',
                rowHeight,
              )}
            >
              {Array.from({ length: cols }, (_, j) => (
                <Skeleton key={j} className={cn('h-3.5 flex-1', j === 0 && 'max-w-48')} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SkPagination({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 justify-end mt-4', className)}>
      <Skeleton className="h-3 w-40 mr-auto" />
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="size-9" />
      ))}
    </div>
  )
}

/** Grilla de tarjetas (banners, promociones): sm 2 · lg 3 columnas, gap-4. */
export function SkCards({ count = 6, cardClassName }: { count?: number; cardClassName: string }) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={cardClassName} />
      ))}
    </div>
  )
}

/** Lista vertical de filas tipo tarjeta (formas de entrega, secciones). */
export function SkList({ count = 4, itemClassName }: { count?: number; itemClassName: string }) {
  return (
    <div className="max-w-200 flex flex-col gap-3">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={itemClassName} />
      ))}
    </div>
  )
}

interface AdminPageSkeletonProps {
  /** Lo que anuncia el lector de pantalla */
  label?: string
  padding?: keyof typeof PAD
  /** Búsqueda en una fila propia ENCIMA del panel (marcas, categorías, colecciones) */
  searchAbove?: { tabs?: number }
  /** Cabecera PanelHeader con N botones */
  header?: { actions?: number; actionSize?: 'sm' | 'md' }
  kpis?: number
  /** Búsqueda + tabs dentro del panel (pedidos, inventario, reclamos, usuarios) */
  filters?: { tabs?: number }
  cols?: number
  rows?: number
  rowHeight?: string
  pagination?: boolean
}

/** Pantalla de tabla del admin, armada con las piezas de arriba. */
export function AdminPageSkeleton({
  label = 'Cargando…',
  padding = 'page',
  searchAbove,
  header,
  kpis,
  filters,
  cols = 6,
  rows = 8,
  rowHeight,
  pagination = false,
}: AdminPageSkeletonProps) {
  return (
    <SkeletonRegion label={label}>
      {searchAbove && <SkFilters tabs={searchAbove.tabs ?? 0} className="px-8 pt-6 mb-0" />}
      <div className={PAD[padding]}>
        {header && <SkHeader {...header} />}
        {kpis ? <SkKpis count={kpis} /> : null}
        {filters && <SkFilters tabs={filters.tabs} />}
        <SkTable cols={cols} rows={rows} rowHeight={rowHeight} />
        {pagination && <SkPagination />}
      </div>
    </SkeletonRegion>
  )
}
