import { FadeImage } from '@/shared/components/ui/FadeImage'
import { cn } from '@/shared/lib/utils'
import type { ReactNode } from 'react'

// ---------------------------------------------------------------------------
// Cabecera de /categorias/[slug] y /marcas/[slug]. Con imagen, el texto va
// sobre un velo oscuro en ambos temas (--on-media, como CategoryTiles y los
// banners); sin imagen, sobre el placeholder a rayas con los tokens del tema.
// Alto mínimo fijo para que el esqueleto (HeroSkeleton) coincida.
// ---------------------------------------------------------------------------

interface PageHeroProps {
  title: string
  description?: string | null
  imageUrl?: string | null
  /** Línea secundaria: "24 productos", tagline de la marca… */
  meta?: ReactNode
  /** Logo u otro elemento sobre el título. */
  badge?: ReactNode
}

export const HERO_MIN_H = 'min-h-[220px] sm:min-h-[280px]'

export function PageHero({ title, description, imageUrl, meta, badge }: PageHeroProps) {
  const media = Boolean(imageUrl)
  return (
    <header
      className={cn(
        'relative isolate overflow-hidden border border-(--bd) mb-6 flex items-end',
        HERO_MIN_H,
        media ? 'bg-skeleton' : 'stripe-fig',
      )}
    >
      {imageUrl && (
        <>
          <FadeImage
            src={imageUrl}
            alt=""
            fill
            priority
            sizes="(max-width: 1400px) 100vw, 1400px"
            className="object-cover -z-10"
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-linear-to-t sm:bg-linear-to-r from-media-scrim via-media-scrim/70 to-media-scrim/10"
          />
        </>
      )}
      <div className="w-full max-w-2xl p-5 sm:p-8 lg:p-10">
        {badge}
        <h1
          className={cn(
            'font-display font-black uppercase tracking-[-1px] leading-[0.95] text-[clamp(36px,5vw,64px)] text-balance',
            media ? 'text-on-media' : 'text-text',
          )}
        >
          {title}
        </h1>
        {description && (
          <p
            className={cn(
              'mt-3 text-[14px] sm:text-[15px] leading-relaxed max-w-[62ch] line-clamp-4',
              media ? 'text-on-media/85' : 'text-muted',
            )}
          >
            {description}
          </p>
        )}
        {meta && (
          <p
            className={cn(
              'mt-4 text-[11px] font-bold tracking-[2px] uppercase',
              media ? 'text-on-media/80' : 'text-accent-ink',
            )}
          >
            {meta}
          </p>
        )}
      </div>
    </header>
  )
}
