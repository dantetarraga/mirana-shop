import type { BannerRow } from '@/features/banners/services/banner.service'

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
    <section className="min-h-screen relative overflow-hidden flex items-center px-12 pt-(--nh)">
      {/* Neon background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 65% 50%, rgba(80,150,255,.08) 0%, transparent 65%), radial-gradient(ellipse 40% 40% at 20% 70%, rgba(80,150,255,.05) 0%, transparent 50%)',
        }}
      />

      <div className="absolute -right-15 top-1/2 translate-y-[-52%] font-display font-black italic pointer-events-none whitespace-nowrap select-none leading-none text-[clamp(180px,20vw,300px)] text-transparent tracking-[-6px] [-webkit-text-stroke:1px_rgba(80,150,255,.06)]">
        COLLECT
      </div>

      {/* Content */}
      <div className="relative z-2 max-w-145">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 text-[10px] font-bold tracking-[3px] uppercase mb-7 bg-(--gd) border border-[rgba(80,150,255,.25)] text-(--gold)">
          <span className="animate-pulse-dot w-1.5 h-1.5 rounded-full inline-block bg-(--gold)" />
          Nueva temporada 2026
        </div>

        <h1 className="font-display font-black uppercase mb-6 tracking-[-2px] leading-[0.9] text-[clamp(60px,8vw,108px)]">
          {title}
        </h1>

        <p className="text-[16px] max-w-100 leading-[1.75] mb-10 font-light text-muted">
          {subtitle}
        </p>

        <div className="flex gap-3 flex-wrap">
          <a href={ctaHref} className="btn-gold">
            {ctaLabel}
          </a>
          <a href="/catalogo?cat=figures" className="btn-outline-mirana">
            Novedades →
          </a>
        </div>

        <div className="flex gap-9 mt-13 pt-8 border-t border-(--bd)">
          {[
            { n: '500+', l: 'Productos' },
            { n: '12K', l: 'Coleccionistas' },
            { n: '4.9★', l: 'Valoración' },
          ].map(({ n, l }) => (
            <div key={l}>
              <div className="font-display text-[40px] font-black leading-none text-(--gold)">
                {n}
              </div>
              <div className="text-[11px] tracking-[1px] uppercase mt-1 text-muted">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Visual — imagen dentro del placeholder original, mismo tamaño */}
      <div className="absolute right-0 top-0 bottom-0 w-[42%] flex items-center justify-center pointer-events-none">
        <div className="stripe-fig w-95 h-120 flex items-center justify-center flex-col gap-2.5 border border-(--bd) relative overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="absolute inset-0 w-full h-full object-cover opacity-70" />
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
