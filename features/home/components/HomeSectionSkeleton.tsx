import { ProductCardSkeleton } from '@/features/products/components/ProductCardSkeleton'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { cn } from '@/shared/lib/utils'

// ---------------------------------------------------------------------------
// Fallback de <Suspense> para las secciones asíncronas del inicio. Reproduce
// la cabecera y la grilla de NewArrivals/FeaturedProducts/PreorderSection
// (mismo `shell`, padding, tipografía del h2 y ProductCardSkeleton) para que el
// HTML llegue antes sin que la página salte cuando se resuelve cada sección.
//
// Sin role="status" propio: la página ya muestra contenido real arriba y cada
// sección que llega se anuncia sola. Los bloques son aria-hidden.
// ---------------------------------------------------------------------------

const GRIDS = {
  /** NewArrivals / FeaturedProducts */
  four: 'grid gap-4 grid-cols-2 lg:grid-cols-4',
  /** PreorderSection */
  auto: 'grid gap-4 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]',
}

export function HomeSectionHeaderSkeleton() {
  return (
    <div className="mb-6 md:mb-8">
      {/* Eyebrow: text-[10px] mb-2.5 */}
      <div className="text-[10px] mb-2.5">
        <Skeleton className="inline-block align-middle h-[1em] w-24" />
      </div>
      {/* h2: clamp(32px,5vw,64px) · leading 0.95 */}
      <div className="font-display leading-[0.95] text-[clamp(32px,5vw,64px)]">
        <Skeleton className="inline-block align-middle h-[0.8em] w-[min(24rem,80%)]" />
      </div>
    </div>
  )
}

export function HomeSectionSkeleton({
  cards = 4,
  grid = 'four',
}: {
  cards?: number
  grid?: keyof typeof GRIDS
}) {
  return (
    <section className="shell py-14 md:py-20" aria-hidden>
      <HomeSectionHeaderSkeleton />
      <div className={GRIDS[grid]}>
        {Array.from({ length: cards }, (_, i) => (
          // En móvil la grilla `four` es de 2 columnas: con 4 cards bastan 2
          // filas, y en auto-fill (1 columna) se muestran solo 2.
          <ProductCardSkeleton key={i} className={cn(grid === 'auto' && i >= 2 && 'max-sm:hidden')} />
        ))}
      </div>
    </section>
  )
}

/** Fallback de la banda CTA: mismo alto aproximado, sin contenido. */
export function CTABandSkeleton() {
  return <Skeleton className="shell-m mb-20 h-40 sm:h-36" />
}
