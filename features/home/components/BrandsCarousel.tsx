'use client'

import type { BrandRow } from '@/features/brands/types'
import { cn } from '@/shared/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

interface BrandsCarouselProps {
  brands: BrandRow[]
}

export function BrandsCarousel({ brands }: BrandsCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  // Si todas las marcas caben sin scroll, se centran y las flechas se ocultan.
  const [hasOverflow, setHasOverflow] = useState(false)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    // ResizeObserver dispara al observar y en cada cambio de tamaño
    const ro = new ResizeObserver(() => {
      setHasOverflow(track.scrollWidth > track.clientWidth + 1)
    })
    ro.observe(track)
    return () => ro.disconnect()
  }, [])

  if (brands.length === 0) return null

  const scrollByPage = (dir: 1 | -1) => {
    const track = trackRef.current
    if (!track) return
    track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <section className="bg-surf border-b border-(--bd)">
      <div className="flex items-center">
        {hasOverflow && (
          <button
            type="button"
            aria-label="Marcas anteriores"
            onClick={() => scrollByPage(-1)}
            className="shrink-0 h-14 sm:h-18 px-2 sm:px-2.5 bg-transparent border-none text-muted transition-colors duration-200 hover:text-(--gold)"
          >
            <ChevronLeft size={26} />
          </button>
        )}

        <div
          ref={trackRef}
          className={cn(
            'flex-1 flex overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            !hasOverflow && 'justify-center',
          )}
        >
          {brands.map((b) => (
            <Link
              key={b.id}
              href={`/catalogo?brand=${b.slug}`}
              title={b.name}
              className="brand-item relative shrink-0 w-32 h-14 sm:w-44 sm:h-18 flex items-center justify-center border-r border-(--bd) no-underline first:border-l"
            >
              {b.imageUrl ? (
                <Image src={b.imageUrl} alt={b.name} fill className="object-cover" />
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

        {hasOverflow && (
          <button
            type="button"
            aria-label="Más marcas"
            onClick={() => scrollByPage(1)}
            className="shrink-0 h-14 sm:h-18 px-2 sm:px-2.5 bg-transparent border-none text-muted transition-colors duration-200 hover:text-(--gold)"
          >
            <ChevronRight size={26} />
          </button>
        )}
      </div>
    </section>
  )
}
