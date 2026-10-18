import { Skeleton } from '@/shared/components/ui/Skeleton'
import { cn } from '@/shared/lib/utils'

// ---------------------------------------------------------------------------
// Esqueleto de ProductCard (y CollectionCard, que comparte su marco).
//
// Cada fila copia la tipografía del componente real (tamaño de fuente,
// line-height, márgenes, min-h) y pinta la barra como inline-block dentro de
// esa línea: así el alto lo pone el mismo "strut" de texto que en la card de
// verdad y el grid no salta cuando llega el contenido. Si cambia ProductCard,
// cambiar aquí las mismas clases.
// ---------------------------------------------------------------------------

const BAR = 'inline-block align-middle'

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('bg-card border border-border', className)}>
      <Skeleton className="aspect-[4/5] w-full" />
      <div className="px-4 pt-4">
        {/* Categoría: text-[11px] mb-1.25 */}
        <div className="text-[11px] mb-1.25">
          <Skeleton className={cn(BAR, 'h-[0.9em] w-20')} />
        </div>
        {/* Nombre: 2 líneas de 21px · leading 1.05 · min-h-11 · mb-3 */}
        <div className="font-display text-[21px] leading-[1.05] mb-3 min-h-11 flex flex-col justify-center gap-1.5">
          <Skeleton className="h-[0.8em] w-11/12" />
          <Skeleton className="h-[0.8em] w-3/5" />
        </div>
      </div>
      <div className="px-4 pb-3.5">
        {/* Precio: text-[20px] sm:text-[26px] · mb-3 */}
        <div className="font-display text-[20px] sm:text-[26px] mb-3">
          <Skeleton className={cn(BAR, 'h-[0.8em] w-28')} />
        </div>
        {/* Botón: mismas clases que el real → mismo alto */}
        <div className="ui-btn ui-btn--md ui-btn--full min-h-11 skeleton">&nbsp;</div>
      </div>
    </div>
  )
}
