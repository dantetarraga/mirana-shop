'use client'

import type { BannerRow } from '@/features/banners/types'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

// Mínimo de tarjetas a mostrar — si hay menos banners reales, se completa
// con promos por defecto para no dejar la vista de escritorio incompleta.
const MIN_CARDS = 3
const AUTOPLAY_MS = 7000

interface HeroBannerCarouselProps {
  banners: BannerRow[]
}

type SlideCard = {
  key: string
  title: string
  subtitle: string | null
  imageUrl: string | null
  ctaLabel: string
  ctaHref: string
  stripe?: string
}

const FALLBACK_CARDS: SlideCard[] = [
  {
    key: 'fb-preorder',
    title: 'Preventas Exclusivas',
    subtitle: 'Asegura tu figura antes que nadie',
    imageUrl: null,
    ctaLabel: 'Ver preventas',
    ctaHref: '/catalogo?avail=preorder',
    stripe: 'stripe-fig',
  },
  {
    key: 'fb-new',
    title: 'Recién Llegados',
    subtitle: 'Lo último en figuras y coleccionables',
    imageUrl: null,
    ctaLabel: 'Ver novedades',
    ctaHref: '/catalogo?sort=newest',
    stripe: 'stripe-lego',
  },
  {
    key: 'fb-stock',
    title: 'Entrega Inmediata',
    subtitle: 'Productos en stock listos para enviar',
    imageUrl: null,
    ctaLabel: 'Comprar ahora',
    ctaHref: '/catalogo?avail=in_stock',
    stripe: 'stripe-veh',
  },
]

function toCards(banners: BannerRow[]): SlideCard[] {
  const cards: SlideCard[] = banners.map((b) => ({
    key: b.id,
    title: b.title,
    subtitle: b.subtitle,
    imageUrl: b.imageUrl || null,
    ctaLabel: b.ctaLabel ?? 'Comprar ahora',
    ctaHref: b.ctaHref ?? '/catalogo',
  }))
  // Completa con promos por defecto si hay menos de MIN_CARDS banners reales
  for (const fb of FALLBACK_CARDS) {
    if (cards.length >= MIN_CARDS) break
    cards.push(fb)
  }
  return cards
}

export function HeroBannerCarousel({ banners }: HeroBannerCarouselProps) {
  const cards = toCards(banners)

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 768px)': { slidesToScroll: 3 },
    },
  })

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    const sync = () => {
      setScrollSnaps(emblaApi.scrollSnapList())
      onSelect()
    }
    sync()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', sync)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', sync)
    }
  }, [emblaApi, onSelect])

  useEffect(() => {
    if (!emblaApi || scrollSnaps.length <= 1) return
    const id = setInterval(() => {
      if (emblaApi.canScrollNext()) emblaApi.scrollNext()
      else emblaApi.scrollTo(0)
    }, AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [emblaApi, scrollSnaps.length])

  const scrollPrev = useCallback(() => {
    if (!emblaApi) return
    if (emblaApi.canScrollPrev()) emblaApi.scrollPrev()
    else emblaApi.scrollTo(scrollSnaps.length - 1)
  }, [emblaApi, scrollSnaps.length])

  const scrollNext = useCallback(() => {
    if (!emblaApi) return
    if (emblaApi.canScrollNext()) emblaApi.scrollNext()
    else emblaApi.scrollTo(0)
  }, [emblaApi])

  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi])
  const showControls = scrollSnaps.length > 1

  return (
    <section className="relative overflow-hidden group/hero">
      <div className="overflow-hidden px-1 pt-1" ref={emblaRef}>
        <div className="flex gap-1">
          {cards.map((card, i) => (
            <div key={card.key} className="flex-none w-full md:w-1/3 min-w-0">
              <Link
                href={card.ctaHref}
                className={`relative overflow-hidden flex flex-col justify-end no-underline h-[220px] sm:h-[280px] md:h-[clamp(300px,38vw,500px)] border border-(--bd) ${card.stripe ?? 'bg-card'}`}
              >
                {card.imageUrl && (
                  <Image
                    src={card.imageUrl}
                    alt={card.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 hover:scale-[1.03]"
                    priority={i === 0}
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[rgba(3,4,9,.85)] to-transparent pointer-events-none" />

                <div className="relative z-1 p-5 pb-6 sm:p-7 sm:pb-8 text-center">
                  <h3 className="font-display font-black uppercase tracking-[-0.5px] leading-[0.95] text-[clamp(20px,2.2vw,34px)] mb-1.5">
                    {card.title}
                  </h3>
                  {card.subtitle && (
                    <p className="text-[13px] text-muted font-light mb-4 sm:mb-5 max-w-70 mx-auto">
                      {card.subtitle}
                    </p>
                  )}
                  <span className="inline-block border border-(--bdh) bg-[rgba(3,4,9,.55)] px-6 sm:px-8 py-2.5 sm:py-3 font-display font-extrabold uppercase text-[12px] sm:text-[13px] tracking-[2px] text-text transition-colors duration-200 hover:bg-(--gold) hover:text-black hover:border-(--gold)">
                    {card.ctaLabel}
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {showControls && (
        <>
          <button
            type="button"
            aria-label="Banner anterior"
            onClick={scrollPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-2 w-11 h-11 flex items-center justify-center bg-[rgba(3,4,9,.6)] border border-(--bd) text-text backdrop-blur-sm transition-all duration-200 hover:border-(--gold) hover:text-(--gold)"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            aria-label="Banner siguiente"
            onClick={scrollNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-2 w-11 h-11 flex items-center justify-center bg-[rgba(3,4,9,.6)] border border-(--bd) text-text backdrop-blur-sm transition-all duration-200 hover:border-(--gold) hover:text-(--gold)"
          >
            <ChevronRight size={22} />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-2 flex gap-2">
            {scrollSnaps.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ir a la vista ${i + 1}`}
                onClick={() => scrollTo(i)}
                className={`h-1.5 border-none transition-all duration-300 ${
                  i === selectedIndex ? 'w-7 bg-(--gold)' : 'w-3 bg-[rgba(228,240,255,.25)] hover:bg-[rgba(228,240,255,.5)]'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
