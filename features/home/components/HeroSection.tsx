import type { BannerRow } from '@/features/banners/types'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface HeroSectionProps {
  banner?: BannerRow | null
}

export function HeroSection({ banner }: HeroSectionProps) {
  const title = banner?.title ?? 'Colecciona lo Extraordinario'
  const subtitle =
    banner?.subtitle ??
    'Figuras de acción, sets LEGO y modelos a escala. Para coleccionistas que no se conforman con menos.'
  const ctaLabel = banner?.ctaLabel ?? 'Ver Catálogo'
  const ctaHref = banner?.ctaHref ?? '/catalogo'
  const imageUrl = banner?.imageUrl ?? null

  return (
    <section className="glow-section relative overflow-hidden shell grid grid-cols-1 md:grid-cols-[1fr_0.85fr] items-center gap-10 md:gap-15 pt-[calc(var(--nh)+48px)] md:pt-[calc(var(--nh)+80px)] pb-14 md:pb-20">
      <div className="hidden md:block absolute -right-15 top-1/2 translate-y-[-52%] font-display font-black italic pointer-events-none whitespace-nowrap select-none leading-none text-[clamp(180px,20vw,300px)] text-transparent tracking-[-6px] [-webkit-text-stroke:1px_rgba(0,200,255,.06)]">
        COLLECT
      </div>

      {/* Content */}
      <div className="relative z-2 max-w-full md:max-w-140">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 text-[10px] font-bold tracking-[3px] uppercase mb-6 md:mb-7 bg-(--gd) border border-[rgba(0,200,255,.25)] text-(--gold)">
          <span className="animate-pulse-dot w-1.5 h-1.5 rounded-full inline-block bg-(--gold)" />
          Nueva temporada 2026
        </div>

        <h1 className="font-display font-black uppercase mb-5 md:mb-6 tracking-[-2px] leading-[0.9] text-[clamp(38px,8vw,82px)]">
          {title}
        </h1>

        <p className="text-[16px] max-w-full md:max-w-100 leading-[1.75] mb-8 md:mb-10 font-light text-muted">
          {subtitle}
        </p>

        <div className="flex gap-3 flex-wrap">
          <Link href={ctaHref} className="btn-gold">
            {ctaLabel}
          </Link>
          <Link
            href="/catalogo?cat=figures"
            className="btn-outline-mirana inline-flex items-center"
          >
            Novedades
            <ArrowRight className="ml-1" size={16} />
          </Link>
        </div>

        <div className="flex gap-5 sm:gap-9 mt-10 md:mt-13 pt-8 border-t border-(--bd)">
          {[
            { n: '500+', l: 'Productos' },
            { n: '12K', l: 'Coleccionistas' },
            { n: '4.9★', l: 'Valoración' },
          ].map(({ n, l }) => (
            <div key={l}>
              <div className="font-display text-[32px] sm:text-[40px] font-black leading-none text-(--gold)">
                {n}
              </div>
              <div className="text-[11px] tracking-[1px] uppercase mt-1 text-muted">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Visual */}
      <div className="relative z-1 flex items-center justify-center">
        <div className="stripe-fig w-full max-w-125 h-[clamp(260px,42vh,520px)] flex items-center justify-center flex-col gap-2.5 border border-(--bd) relative overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover opacity-70"
              fill
            />
          ) : (
            <span className="font-mono text-[11px] tracking-[2px] uppercase text-muted">
              product shot
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
