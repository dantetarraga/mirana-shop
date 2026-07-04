'use client'

import type { BannerRow } from '@/features/banners/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

const PER_VIEW = 3
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
  // Completa la primera vista con promos por defecto si hay menos de 3 banners
  for (const fb of FALLBACK_CARDS) {
    if (cards.length >= PER_VIEW) break
    cards.push(fb)
  }
  return cards
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

export function HeroBannerCarousel({ banners }: HeroBannerCarouselProps) {
  const slides = chunk(toCards(banners), PER_VIEW)
  const [page, setPage] = useState(0)
  const total = slides.length

  const goTo = useCallback(
    (next: number) => setPage(((next % total) + total) % total),
    [total],
  )

  useEffect(() => {
    if (total <= 1) return
    const id = setInterval(() => setPage((p) => (p + 1) % total), AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [total, page])

  return (
    <section className="relative overflow-hidden group/hero">
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${page * 100}%)` }}
      >
        {slides.map((cards, i) => (
          <div key={i} className="w-full shrink-0 grid grid-cols-1 md:grid-cols-3 gap-1 px-1 pt-1">
            {cards.map((card) => (
              <Link
                key={card.key}
                href={card.ctaHref}
                className={`relative overflow-hidden flex flex-col justify-end no-underline h-[clamp(300px,38vw,500px)] border border-(--bd) ${card.stripe ?? 'bg-card'}`}
              >
                {card.imageUrl && (
                  <Image
                    src={card.imageUrl}
                    alt={card.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover/hero:scale-100 hover:scale-[1.03]"
                    priority={i === 0}
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[rgba(3,4,9,.85)] to-transparent pointer-events-none" />

                <div className="relative z-1 p-7 pb-8 text-center">
                  <h3 className="font-display font-black uppercase tracking-[-0.5px] leading-[0.95] text-[clamp(24px,2.2vw,34px)] mb-1.5">
                    {card.title}
                  </h3>
                  {card.subtitle && (
                    <p className="text-[13px] text-muted font-light mb-5 max-w-70 mx-auto">
                      {card.subtitle}
                    </p>
                  )}
                  <span className="inline-block border border-(--bdh) bg-[rgba(3,4,9,.55)] px-8 py-3 font-display font-extrabold uppercase text-[13px] tracking-[2px] text-text transition-colors duration-200 hover:bg-(--gold) hover:text-black hover:border-(--gold)">
                    {card.ctaLabel}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ))}
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            aria-label="Banner anterior"
            onClick={() => goTo(page - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-2 w-11 h-11 flex items-center justify-center bg-[rgba(3,4,9,.6)] border border-(--bd) text-text backdrop-blur-sm transition-all duration-200 hover:border-(--gold) hover:text-(--gold)"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            aria-label="Banner siguiente"
            onClick={() => goTo(page + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-2 w-11 h-11 flex items-center justify-center bg-[rgba(3,4,9,.6)] border border-(--bd) text-text backdrop-blur-sm transition-all duration-200 hover:border-(--gold) hover:text-(--gold)"
          >
            <ChevronRight size={22} />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-2 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ir a la vista ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-1.5 border-none transition-all duration-300 ${
                  i === page ? 'w-7 bg-(--gold)' : 'w-3 bg-[rgba(228,240,255,.25)] hover:bg-[rgba(228,240,255,.5)]'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
