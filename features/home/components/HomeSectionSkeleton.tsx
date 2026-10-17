import { Skeleton } from '@/shared/components/ui/Skeleton'

// ---------------------------------------------------------------------------
// Fallback de <Suspense> para las secciones asíncronas del inicio. Reproduce
// la cabecera y la grilla de NewArrivals/FeaturedProducts para que el HTML
// llegue antes sin que la página salte cuando se resuelve cada sección.
// ---------------------------------------------------------------------------

export function HomeSectionSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <section className="shell py-14 md:py-20" aria-hidden>
      <div className="flex flex-col gap-2.5 mb-6 md:mb-8">
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="h-10 w-64 md:h-14 md:w-96" />
      </div>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        ))}
      </div>
    </section>
  )
}

/** Fallback de la banda CTA: mismo alto aproximado, sin contenido. */
export function CTABandSkeleton() {
  return <Skeleton className="shell-m mb-20 h-40 sm:h-36" />
}
