import { getHomeCta } from '@/features/home/queries/home-cta.queries'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/utils'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export async function CTABand() {
  const cta = await getHomeCta()

  if (!cta.active) return null

  const hasImage = Boolean(cta.imageUrl)

  return (
    <div
      className={cn(
        'relative shell-m mb-20 shell py-12 flex items-center justify-between gap-6 overflow-hidden',
        '[clip-path:polygon(0_0,calc(100%-16px)_0,100%_16px,100%_100%,16px_100%,0_calc(100%-16px))]',
        hasImage ? 'bg-cover bg-center' : 'bg-(--gold)',
      )}
      style={hasImage ? { backgroundImage: `url(${cta.imageUrl})` } : undefined}
    >
      {/* Oscurece la imagen para que el texto siga siendo legible */}
      {hasImage && <div className="absolute inset-0 bg-black/55" aria-hidden />}

      <div className="relative z-1">
        <h2
          className={cn(
            'font-display font-black uppercase leading-[0.95] tracking-[-1px] text-[clamp(28px,4vw,54px)] whitespace-pre-line',
            hasImage ? 'text-white' : 'text-black',
          )}
        >
          {cta.title}
        </h2>
        {cta.subtitle && (
          <p className={cn('text-[14px] mt-2', hasImage ? 'text-white/70' : 'text-black/55')}>
            {cta.subtitle}
          </p>
        )}
      </div>
      {cta.ctaLabel && (
        <Link href={cta.ctaHref || '/catalogo'} className="relative z-1 no-underline shrink-0">
          <Button
            variant={hasImage ? 'accent' : 'dark'}
            size="lg"
            className="whitespace-nowrap"
          >
            {cta.ctaLabel}
            <ArrowRight size={14} className="ml-1" strokeWidth={3} />
          </Button>
        </Link>
      )}
    </div>
  )
}
