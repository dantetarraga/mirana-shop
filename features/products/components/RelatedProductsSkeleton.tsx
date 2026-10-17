import { ProductCardSkeleton } from '@/features/products/components/ProductCardSkeleton'
import { Skeleton } from '@/shared/components/ui/Skeleton'

/** Esqueleto de "Productos relacionados" — mismo marco que RelatedProducts. */
export function RelatedProductsSkeleton() {
  return (
    <section
      className="px-4 sm:px-6 py-10 sm:py-16 border-t border-(--bd)"
      aria-hidden
    >
      <div className="max-w-360 mx-auto">
        <div className="mb-6 sm:mb-8 flex flex-col gap-2.5">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-10 w-72 max-w-full" />
        </div>
        <div className="relative px-0 sm:px-6 flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }, (_, i) => (
            <ProductCardSkeleton
              key={i}
              className={`flex-none w-[calc((100%-16px)/2)] sm:w-[calc((100%-32px)/3)] md:w-[calc((100%-48px)/4)] lg:w-[calc((100%-64px)/5)] ${i >= 2 ? 'max-sm:hidden' : ''}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
