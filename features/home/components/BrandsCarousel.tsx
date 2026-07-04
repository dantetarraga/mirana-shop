'use client'

import type { BrandRow } from '@/features/brands/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useRef } from 'react'

interface BrandsCarouselProps {
  brands: BrandRow[]
}

export function BrandsCarousel({ brands }: BrandsCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  if (brands.length === 0) return null

  const scrollByPage = (dir: 1 | -1) => {
    const track = trackRef.current
    if (!track) return
    track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <section className="bg-surf border-b border-(--bd)">
      <div className="flex items-center">
        <button
          type="button"
          aria-label="Marcas anteriores"
          onClick={() => scrollByPage(-1)}
          className="shrink-0 h-24 px-2.5 bg-transparent border-none text-muted transition-colors duration-200 hover:text-(--gold)"
        >
          <ChevronLeft size={26} />
        </button>

        <div
          ref={trackRef}
          className="flex-1 flex overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {brands.map((b) => (
            <Link
              key={b.id}
              href={`/catalogo?brand=${b.slug}`}
              title={b.name}
              className="brand-item shrink-0 w-44 h-24 flex items-center justify-center border-r border-(--bd) px-6 no-underline first:border-l"
            >
              {b.imageUrl ? (
                <img src={b.imageUrl} alt={b.name} className="max-h-12 max-w-32 object-contain" />
              ) : (
                <div className="text-center">
                  <div className="font-display font-black uppercase tracking-[1px] leading-none text-text text-[18px]">
                    {b.name}
                  </div>
                  {b.tagline && (
                    <div className="font-sans text-[8px] tracking-[2.5px] font-medium text-muted mt-1">
                      {b.tagline}
                    </div>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>

        <button
          type="button"
          aria-label="Más marcas"
          onClick={() => scrollByPage(1)}
          className="shrink-0 h-24 px-2.5 bg-transparent border-none text-muted transition-colors duration-200 hover:text-(--gold)"
        >
          <ChevronRight size={26} />
        </button>
      </div>
    </section>
  )
}
