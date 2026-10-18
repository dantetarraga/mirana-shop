'use client'

import type { BrandRow } from '@/features/brands/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

interface BrandsCarouselProps {
  /** Destacadas en el orden del admin (`position`); enlazan a /marcas/[slug]. */
  brands: Pick<BrandRow, 'id' | 'name' | 'slug' | 'imageUrl' | 'tagline'>[]
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
    <section aria-labelledby="home-brands-title" className="shell pt-12 md:pt-16">
      <div className="flex items-end justify-between gap-4 mb-5">
        <h2
          id="home-brands-title"
          className="font-display font-black uppercase tracking-[-0.5px] leading-none text-[clamp(26px,3.4vw,40px)]"
        >
          Marcas
        </h2>
        <Link
          href="/marcas"
          className="text-[13px] font-semibold text-accent-ink underline underline-offset-2 hover:no-underline"
        >
          Ver todas las marcas
        </Link>
      </div>
      <div className="flex items-center gap-1">
        {hasOverflow && (
          <button
            type="button"
            aria-label="Marcas anteriores"
            onClick={() => scrollByPage(-1)}
            className="shrink-0 grid place-items-center w-11 h-18 sm:h-22 bg-transparent border-none text-muted transition-colors duration-200 hover:text-accent-ink"
          >
            <ChevronLeft size={26} aria-hidden />
          </button>
        )}

        <div
          ref={trackRef}
          // Alineado a la izquierda con el título, haya o no desborde.
          className="flex-1 flex overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {brands.map((b) => (
            <Link
              key={b.id}
              href={`/marcas/${b.slug}`}
              title={b.name}
              className="brand-item relative shrink-0 w-36 h-18 sm:w-44 sm:h-22 mr-3 last:mr-0 flex items-center justify-center bg-white border border-black/10 no-underline transition-colors hover:border-(--bdh) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {/* Logo entero sobre placa blanca en ambos temas: los logos se
                  diseñan para fondo claro y recortarlos los vuelve ilegibles. */}
              {b.imageUrl ? (
                <span className="absolute inset-3">
                  <Image src={b.imageUrl} alt={b.name} fill sizes="176px" className="object-contain" />
                </span>
              ) : (
                <div className="text-center">
                  <div className="font-display font-black uppercase tracking-[1px] leading-none text-[#0b1830] text-[18px]">
                    {b.name}
                  </div>
                  {b.tagline && (
                    <div className="font-sans text-[11px] font-medium text-[#4a5b6b] mt-1">
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
            className="shrink-0 grid place-items-center w-11 h-18 sm:h-22 bg-transparent border-none text-muted transition-colors duration-200 hover:text-accent-ink"
          >
            <ChevronRight size={26} aria-hidden />
          </button>
        )}
      </div>
    </section>
  )
}
