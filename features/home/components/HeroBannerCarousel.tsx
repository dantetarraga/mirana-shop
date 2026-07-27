'use client'

import { BannerImage } from '@/features/banners/components/BannerImage'
import type { BannerRow } from '@/features/banners/types'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

// A partir de este número de banners reales se usa carrusel; por debajo,
// grid estático que se acomoda al número de tarjetas disponibles.
const CAROUSEL_THRESHOLD = 3
const AUTOPLAY_MS = 7000

interface HeroBannerCarouselProps {
  banners: BannerRow[]
}

type SlideCard = {
  key: string
  title: string
  subtitle: string | null
  imageUrl: string
  imageUrlMobile: string | null
  ctaLabel: string
  ctaHref: string
}

function toCards(banners: BannerRow[]): SlideCard[] {
  return banners.map((b) => ({
    key: b.id,
    title: b.title,
    subtitle: b.subtitle,
    imageUrl: b.imageUrl,
    imageUrlMobile: b.imageUrlMobile,
    ctaLabel: b.ctaLabel ?? 'Comprar ahora',
    ctaHref: b.ctaHref ?? '/catalogo',
  }))
}

function BannerCard({ card, priority, className }: { card: SlideCard; priority: boolean; className?: string }) {
  return (
    <Link
      href={card.ctaHref}
      className={`relative overflow-hidden flex flex-col justify-end no-underline h-[220px] sm:h-[280px] md:h-[clamp(300px,38vw,500px)] border border-(--bd) bg-card ${className ?? ''}`}
    >
      <BannerImage
        desktopUrl={card.imageUrl}
        mobileUrl={card.imageUrlMobile}
        alt={card.title}
        sizes="(max-width: 767px) 100vw, 33vw"
        priority={priority}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-[1.03]"
      />
      <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-media-scrim to-transparent pointer-events-none" />

      {/* Todo este bloque va sobre el velo oscuro (`media-scrim`), que es oscuro
          en ambos temas: usa --on-media (blanco fijo), no los tokens del tema.
          Con `text-text` el botón quedaba casi negro sobre fondo oscuro en modo
          claro y solo se leía al pasar el mouse, cuando el hover lo pinta de
          dorado. Mismo criterio que CategoryStrips y HeroBannerFade. */}
      <div className="relative z-1 p-5 pb-6 sm:p-7 sm:pb-8 text-center">
        <h3 className="font-display font-black uppercase tracking-[-0.5px] leading-[0.95] text-[clamp(20px,2.2vw,34px)] mb-1.5 text-on-media">
          {card.title}
        </h3>
        {card.subtitle && (
          <p className="text-[13px] text-on-media/75 font-light mb-4 sm:mb-5 max-w-70 mx-auto">
            {card.subtitle}
          </p>
        )}
        <span className="inline-block border border-(--bdh) bg-media-scrim/70 px-6 sm:px-8 py-2.5 sm:py-3 font-display font-extrabold uppercase text-[12px] sm:text-[13px] tracking-[2px] text-on-media transition-colors duration-200 hover:bg-(--gold) hover:text-on-accent hover:border-(--gold)">
          {card.ctaLabel}
        </span>
      </div>
    </Link>
  )
}

function gridColsClass(count: number) {
  if (count === 1) return 'grid-cols-1'
  if (count === 2) return 'grid-cols-1 sm:grid-cols-2'
  return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
}

function HeroBannerGrid({ cards }: { cards: SlideCard[] }) {
  return (
    <section className={`grid ${gridColsClass(cards.length)} gap-1 px-1 pt-1`}>
      {cards.map((card, i) => (
        <BannerCard key={card.key} card={card} priority={i === 0} />
      ))}
    </section>
  )
}

function HeroBannerSlider({ cards }: { cards: SlideCard[] }) {
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
              <BannerCard card={card} priority={i === 0} />
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
            className="absolute left-3 top-1/2 -translate-y-1/2 z-2 w-11 h-11 flex items-center justify-center bg-media-scrim/70 border border-(--bdh) text-on-media backdrop-blur-sm transition-all duration-200 hover:border-(--gold) hover:text-(--gold)"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            aria-label="Banner siguiente"
            onClick={scrollNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-2 w-11 h-11 flex items-center justify-center bg-media-scrim/70 border border-(--bdh) text-on-media backdrop-blur-sm transition-all duration-200 hover:border-(--gold) hover:text-(--gold)"
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
                  i === selectedIndex ? 'w-7 bg-(--gold)' : 'w-3 bg-on-media/30 hover:bg-on-media/60'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}

export function HeroBannerCarousel({ banners }: HeroBannerCarouselProps) {
  if (banners.length === 0) return null

  const cards = toCards(banners)

  return cards.length > CAROUSEL_THRESHOLD ? <HeroBannerSlider cards={cards} /> : <HeroBannerGrid cards={cards} />
}
