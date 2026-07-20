'use client'

import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { type ReactNode, useState } from 'react'

type CarouselImage = { url: string; alt: string | null }

interface ProductImageCarouselProps {
  images: CarouselImage[]
  name: string
  /** Clases del contenedor principal (aspect ratio, stripe de categoría, min-height, etc.) */
  className: string
  sizes: string
  priority?: boolean
  /** Badges/botones absolutos que van dentro del contenedor principal (junto a la imagen) */
  children?: ReactNode
  thumbClassName?: string
}

export function ProductImageCarousel({
  images,
  name,
  className,
  sizes,
  priority,
  children,
  thumbClassName,
}: ProductImageCarouselProps) {
  const [index, setIndex] = useState(0)
  const hasMultiple = images.length > 1
  const current = images[index]

  const goTo = (i: number) => setIndex((i + images.length) % images.length)

  return (
    <div className="flex flex-col gap-2 sm:gap-3 w-full">
      <div className={className}>
        {current ? (
          <Image
            src={current.url}
            alt={current.alt || name}
            fill
            priority={priority}
            sizes={sizes}
            className="relative z-1 object-cover"
          />
        ) : (
          <div className="relative z-1 font-mono text-[12px] tracking-[2px] text-muted uppercase">
            {name.toUpperCase()}
          </div>
        )}

        {hasMultiple && (
          <>
            <Button
              type="button"
              variant="icon"
              size="md"
              onClick={() => goTo(index - 1)}
              aria-label="Imagen anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10"
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              type="button"
              variant="icon"
              size="md"
              onClick={() => goTo(index + 1)}
              aria-label="Imagen siguiente"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10"
            >
              <ChevronRight size={16} />
            </Button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 font-mono text-[10px] tracking-[1px] text-white/80 bg-black/60 px-2 py-0.5">
              {index + 1} / {images.length}
            </div>
          </>
        )}

        {children}
      </div>

      {hasMultiple && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver imagen ${i + 1}`}
              className={cn(
                'relative shrink-0 overflow-hidden border transition-colors duration-200',
                thumbClassName ?? 'w-14 h-14 sm:w-16 sm:h-16',
                i === index ? 'border-(--gold)' : 'border-(--bd) hover:border-white/40',
              )}
            >
              <Image src={img.url} alt={img.alt || name} fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
