'use client'

import { ProductCard } from '@/features/products/components/ProductCard'
import type { CatalogProduct } from '@/features/products/types/catalog.types'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface Props {
  items: CatalogProduct[]
}

const GAP = 16 // gap-4 = 16px
// Mínimo de items visibles en el breakpoint más chico (mobile) — usado solo
// para decidir si mostrar las flechas prev/next en desktop.
const MIN_VISIBLE = 2

export function ProductCarousel({ items }: Props) {
  const hasControls = items.length > MIN_VISIBLE

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    dragFree: false,
    slidesToScroll: 1,
    watchDrag: true,
  })

  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const [isScrolling, setIsScrolling] = useState(false)

  const updateButtons = useCallback(() => {
    if (!emblaApi) return
    setCanPrev(emblaApi.canScrollPrev())
    setCanNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on('init', updateButtons)
    emblaApi.on('reInit', updateButtons)
    emblaApi.on('select', updateButtons)
    emblaApi.on('scroll', () => setIsScrolling(true))
    emblaApi.on('settle', () => setIsScrolling(false))
    updateButtons()
    return () => {
      emblaApi.off('init', updateButtons)
      emblaApi.off('reInit', updateButtons)
      emblaApi.off('select', updateButtons)
      emblaApi.off('scroll', () => setIsScrolling(true))
      emblaApi.off('settle', () => setIsScrolling(false))
    }
  }, [emblaApi, updateButtons])

  // Al navegar entre slugs, volver al inicio
  useEffect(() => {
    if (!emblaApi) return
    emblaApi.reInit()
    emblaApi.scrollTo(0, true)
    updateButtons()
  }, [emblaApi, items, updateButtons])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex" style={{ gap: `${GAP}px` }}>
          {items.map((p) => (
            <div
              key={p.id}
              className={`flex-none w-[calc((100%-16px)/2)] sm:w-[calc((100%-32px)/3)] md:w-[calc((100%-48px)/4)] lg:w-[calc((100%-64px)/5)] ${isScrolling ? 'pointer-events-none' : ''}`}
            >
              <ProductCard product={p} noAnimation />
            </div>
          ))}
        </div>
      </div>

      {hasControls && (
        <>
          <button
            onClick={scrollPrev}
            disabled={!canPrev}
            aria-label="Anterior"
            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 z-10
              size-10 rounded-full bg-(--surf) border border-(--bd) items-center justify-center
              shadow-md transition-all duration-200
              disabled:opacity-0 disabled:pointer-events-none
              hover:bg-(--gold) hover:border-(--gold) hover:text-black"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={scrollNext}
            disabled={!canNext}
            aria-label="Siguiente"
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 z-10
              size-10 rounded-full bg-(--surf) border border-(--bd) items-center justify-center
              shadow-md transition-all duration-200
              disabled:opacity-0 disabled:pointer-events-none
              hover:bg-(--gold) hover:border-(--gold) hover:text-black"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}
    </div>
  )
}
