import { FadeImage } from '@/shared/components/ui/FadeImage'
import { cn } from '@/shared/lib/utils'
import Link from 'next/link'

export interface BrandCardData {
  name: string
  slug: string
  imageUrl: string | null
  tagline?: string | null
  productCount?: number
}

/**
 * Tarjeta de marca del índice /marcas. El logo ocupa la celda entera con la
 * misma proporción que el carrusel del inicio (los logos se suben pensados
 * para esa caja); sin logo, el nombre en la tipografía display.
 */
export function BrandCard({ brand, size = 'md' }: { brand: BrandCardData; size?: 'md' | 'lg' }) {
  return (
    <Link
      href={`/marcas/${brand.slug}`}
      className="group flex flex-col h-full bg-card border border-(--bd) no-underline transition-colors duration-150 hover:border-(--bdh)"
    >
      <div className="relative aspect-[22/9] overflow-hidden bg-surf border-b border-(--bd) grid place-items-center">
        {brand.imageUrl ? (
          <FadeImage
            src={brand.imageUrl}
            alt=""
            fill
            sizes={size === 'lg' ? '(max-width: 640px) 50vw, 25vw' : '(max-width: 640px) 50vw, 20vw'}
            className="object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="font-display font-black uppercase tracking-[1px] text-text text-[22px] leading-none px-3 text-center"
          >
            {brand.name}
          </span>
        )}
      </div>
      <div className={cn('flex items-baseline justify-between gap-2', size === 'lg' ? 'px-4 py-3' : 'px-3 py-2.5')}>
        <span
          className={cn(
            'font-display font-extrabold uppercase tracking-[0.5px] text-text group-hover:text-accent-ink transition-colors truncate',
            size === 'lg' ? 'text-[17px]' : 'text-[15px]',
          )}
        >
          {brand.name}
        </span>
        {brand.productCount != null && (
          <span className="shrink-0 text-[11px] tabular-nums text-muted">
            {brand.productCount}
            <span className="sr-only"> productos</span>
          </span>
        )}
      </div>
    </Link>
  )
}
