import type { BrandRow } from '@/modules/catalog/repositories/brand.repo'

interface BrandsCarouselProps {
  brands: BrandRow[]
}

export function BrandsCarousel({ brands }: BrandsCarouselProps) {
  if (brands.length === 0) return null

  const doubled = [...brands, ...brands]

  return (
    <section className="py-[60px] border-t border-(--bd) border-b border-b-(--bd) overflow-hidden">
      <div className="px-12 pb-8 flex justify-between items-baseline">
        <div>
          <div className="text-[10px] font-bold tracking-[3px] uppercase text-(--gold) mb-2.5">
            Marcas oficiales
          </div>
          <h2 className="font-display font-black uppercase tracking-[-1px] leading-[0.95] text-[clamp(28px,3.5vw,42px)]">
            Distribuidor autorizado
          </h2>
        </div>
        <div className="text-[12px] text-muted tracking-[1px] uppercase">
          {brands.length}+ marcas premium
        </div>
      </div>

      <div className="animate-marquee-slow flex gap-0">
        {doubled.map((b, i) => (
          <div
            key={`${b.id}-${i}`}
            className="brand-item shrink-0 w-[240px] h-[120px] flex items-center justify-center border-r border-(--bd) px-8"
          >
            {b.imageUrl ? (
              <img src={b.imageUrl} alt={b.name} className="max-h-15 max-w-40 object-contain" />
            ) : (
              <div className="text-center">
                <div className="font-display font-black uppercase tracking-[1px] leading-none text-text text-[24px]">
                  {b.name}
                </div>
                {b.tagline && (
                  <div className="font-sans text-[9px] tracking-[3px] font-medium text-muted mt-1.5">
                    {b.tagline}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
