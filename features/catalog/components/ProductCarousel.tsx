'use client'

import { ProductCard } from '@/shared/components/ProductCard'
import type { CatalogProduct } from '@/shared/types/catalog.types'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface Props {
  items: CatalogProduct[]
}

const VISIBLE = 5
const GAP = 16 // gap-4 = 16px

export function ProductCarousel({ items }: Props) {
  const hasControls = items.length > VISIBLE

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    dragFree: false,
    slidesToScroll: VISIBLE,
    watchDrag: hasControls,
  })

  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

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
    updateButtons()
    return () => {
      emblaApi.off('init', updateButtons)
      emblaApi.off('reInit', updateButtons)
      emblaApi.off('select', updateButtons)
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
              style={{ flex: `0 0 calc((100% - ${GAP * (VISIBLE - 1)}px) / ${VISIBLE})` }}
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
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 z-10
              size-10 rounded-full bg-(--surf) border border-(--bd) flex items-center justify-center
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
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 z-10
              size-10 rounded-full bg-(--surf) border border-(--bd) flex items-center justify-center
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
