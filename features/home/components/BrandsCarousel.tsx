'use client'

import { FadeImage } from '@/shared/components/ui/FadeImage'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

export interface BrandShowcaseItem {
  id: string
  name: string
  slug: string
  /** Logo del fabricante (opcional): va en una placa blanca sobre la foto. */
  imageUrl: string | null
  tagline: string | null
  productCount: number
  /** Foto de la tarjeta: heroUrl de la marca o su producto destacado. */
  coverUrl: string | null
}

interface BrandsCarouselProps {
  /** Destacadas en el orden del admin (`position`); enlazan a /marcas/[slug]. */
  brands: BrandShowcaseItem[]
}

const productsLabel = (n: number) => (n === 1 ? '1 producto' : `${n} productos`)

/**
 * Vitrina de marcas del inicio: cada marca se presenta con una foto real de lo
 * que vende, a sangre, y su nombre encima. No depende de que el admin suba
 * logos (si lo hace, el logo se suma en una placa blanca).
 */
export function BrandsCarousel({ brands }: BrandsCarouselProps) {
  const trackRef = useRef<HTMLUListElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const update = () => {
      setCanPrev(track.scrollLeft > 4)
      setCanNext(track.scrollLeft + track.clientWidth < track.scrollWidth - 4)
    }
    update()
    // ResizeObserver dispara al observar y en cada cambio de tamaño.
    const ro = new ResizeObserver(update)
    ro.observe(track)
    track.addEventListener('scroll', update, { passive: true })
    return () => {
      ro.disconnect()
      track.removeEventListener('scroll', update)
    }
  }, [])

  if (brands.length === 0) return null

  const scrollByPage = (dir: 1 | -1) => {
    const track = trackRef.current
    if (!track) return
    track.scrollBy({ left: dir * track.clientWidth * 0.9, behavior: 'smooth' })
  }

  const arrowCls =
    'grid place-items-center w-11 h-11 border border-(--bd) bg-card text-text transition-colors hover:border-(--bdh) hover:text-accent-ink disabled:opacity-35 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-ring'

  return (
    <section aria-labelledby="home-brands-title" className="shell pt-12 md:pt-16">
      <div className="flex items-end justify-between gap-4 mb-5">
        <h2
          id="home-brands-title"
          className="font-display font-black uppercase tracking-[-0.5px] leading-none text-[clamp(26px,3.4vw,40px)]"
        >
          Marcas
        </h2>
        <div className="flex items-center gap-3">
          <Link
            href="/marcas"
            className="text-[13px] font-semibold text-accent-ink underline underline-offset-2 hover:no-underline"
          >
            Ver todas
          </Link>
          {(canPrev || canNext) && (
            <div className="hidden sm:flex gap-1.5">
              <button
                type="button"
                aria-label="Marcas anteriores"
                onClick={() => scrollByPage(-1)}
                disabled={!canPrev}
                className={arrowCls}
              >
                <ChevronLeft size={20} aria-hidden />
              </button>
              <button
                type="button"
                aria-label="Más marcas"
                onClick={() => scrollByPage(1)}
                disabled={!canNext}
                className={arrowCls}
              >
                <ChevronRight size={20} aria-hidden />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Deslizable con el dedo; en móvil asoma la siguiente tarjeta para que
          se entienda que hay más. */}
      <ul
        ref={trackRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {brands.map((b) => (
          <li
            key={b.id}
            className="snap-start shrink-0 w-[68%] min-[480px]:w-[45%] md:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)]"
          >
            <Link
              href={`/marcas/${b.slug}`}
              className="group relative block aspect-[4/5] overflow-hidden bg-(--brand-navy) no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {b.coverUrl && (
                <FadeImage
                  src={b.coverUrl}
                  alt=""
                  fill
                  sizes="(max-width: 480px) 68vw, (max-width: 768px) 45vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.05] motion-reduce:transition-none"
                />
              )}
              {/* Degradado solo en la mitad inferior: la foto se ve entera y el
                  texto blanco conserva contraste sobre cualquier imagen. */}
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/85 via-black/45 to-transparent"
              />

              {b.imageUrl && (
                <span className="absolute top-3 left-3 w-24 h-12 bg-white p-2 shadow-sm">
                  <span className="relative block w-full h-full">
                    <Image src={b.imageUrl} alt="" fill sizes="96px" className="object-contain" />
                  </span>
                </span>
              )}

              <span className="absolute inset-x-0 bottom-0 p-4 sm:p-5 text-on-media">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-display font-black uppercase leading-none tracking-[-0.2px] text-[clamp(22px,2.2vw,28px)]">
                    {b.name}
                  </span>
                  <ChevronRight
                    size={22}
                    aria-hidden
                    className="shrink-0 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
                  />
                </span>
                <span className="block mt-1.5 text-[13px] text-on-media/80">
                  {b.tagline ? `${b.tagline} · ` : ''}
                  {productsLabel(b.productCount)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
