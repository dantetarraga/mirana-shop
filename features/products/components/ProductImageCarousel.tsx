'use client'

import { Button } from '@/shared/components/ui/Button'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import { useFocusTrap } from '@/shared/hooks/useFocusTrap'
import { useScrollLock } from '@/shared/hooks/useScrollLock'
import { cn } from '@/shared/lib/utils'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight, Expand, X, ZoomIn, ZoomOut } from 'lucide-react'
import Image from 'next/image'
import { type KeyboardEvent, type ReactNode, useCallback, useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'

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
  /** Clases de la tira de miniaturas (p. ej. separarlas del borde del panel) */
  thumbsWrapperClassName?: string
}

/** Alt de cada imagen: el del admin, o uno que distinga las fotos entre sí. */
function altFor(img: CarouselImage, name: string, i: number) {
  return img.alt?.trim() || `${name} — imagen ${i + 1}`
}

/**
 * Galería de producto.
 * - Swipe/arrastre (embla), flechas, ←/→ con el foco en la galería.
 * - Las imágenes vecinas a la visible se cargan `eager` para que el swipe no
 *   muestre un hueco; el resto sigue en lazy.
 * - La posición se anuncia por aria-live ("Imagen 2 de 5").
 * - Click / Enter en la imagen abre un visor a pantalla completa con zoom.
 */
export function ProductImageCarousel({
  images,
  name,
  className,
  sizes,
  priority,
  children,
  thumbClassName,
  thumbsWrapperClassName,
}: ProductImageCarouselProps) {
  const total = images.length
  const hasMultiple = total > 1
  const reducedMotion = useReducedMotion()
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: hasMultiple,
    watchDrag: hasMultiple,
    duration: reducedMotion ? 10 : 25,
  })
  const [index, setIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const galleryId = useId()

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setIndex(emblaApi.selectedScrollSnap())
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi])

  const goTo = useCallback(
    (i: number) => {
      const next = (i + total) % total
      if (emblaApi) emblaApi.scrollTo(next)
      else setIndex(next)
    },
    [emblaApi, total],
  )
  const prev = useCallback(() => goTo(index - 1), [goTo, index])
  const next = useCallback(() => goTo(index + 1), [goTo, index])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!hasMultiple) return
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      prev()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      next()
    }
  }

  const isNear = (i: number) => {
    if (i === index) return true
    const d = Math.abs(i - index)
    return d === 1 || d === total - 1
  }

  return (
    <div className="flex flex-col gap-2 sm:gap-3 w-full">
      {/* La región recibe foco para que ←/→ funcionen sin tener que llegar a
          las flechas; `aria-roledescription` la anuncia como carrusel. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        className={className}
        role="region"
        aria-roledescription="carrusel"
        aria-label={`Galería de ${name}`}
        tabIndex={hasMultiple ? 0 : undefined}
        onKeyDown={onKeyDown}
      >
        {total > 0 ? (
          <div className="absolute inset-0 z-1 overflow-hidden" ref={emblaRef}>
            <div className="flex h-full touch-pan-y">
              {images.map((img, i) => (
                <div
                  key={img.url + i}
                  className="relative flex-[0_0_100%] min-w-0 h-full"
                  role="group"
                  aria-roledescription="diapositiva"
                  aria-label={`${i + 1} de ${total}`}
                  aria-hidden={i !== index}
                >
                  <button
                    type="button"
                    tabIndex={i === index ? 0 : -1}
                    onClick={() => setLightboxOpen(true)}
                    aria-label={`Ampliar imagen ${i + 1} de ${total}`}
                    className="absolute inset-0 w-full h-full cursor-zoom-in"
                  >
                    <Image
                      src={img.url}
                      alt={altFor(img, name, i)}
                      fill
                      priority={priority && i === 0}
                      loading={priority && i === 0 ? undefined : isNear(i) ? 'eager' : 'lazy'}
                      sizes={sizes}
                      className="object-cover"
                      draggable={false}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="relative z-1 font-mono text-[12px] tracking-[2px] text-muted uppercase">
            {name.toUpperCase()}
          </div>
        )}

        {total > 0 && (
          <Button
            type="button"
            variant="icon"
            size="md"
            onClick={() => setLightboxOpen(true)}
            aria-label="Ver imagen a pantalla completa"
            className="absolute bottom-3 right-3 z-10 bg-media-scrim/60 hover:bg-media-scrim/80 border-on-media/10 text-on-media hover:text-on-media"
          >
            <Expand size={16} aria-hidden />
          </Button>
        )}

        {hasMultiple && (
          <>
            <Button
              type="button"
              variant="icon"
              size="md"
              onClick={prev}
              aria-label="Imagen anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-media-scrim/60 hover:bg-media-scrim/80 border-on-media/10 hover:border-on-media/20 text-on-media hover:text-on-media"
            >
              <ChevronLeft size={18} aria-hidden />
            </Button>
            <Button
              type="button"
              variant="icon"
              size="md"
              onClick={next}
              aria-label="Imagen siguiente"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-media-scrim/60 hover:bg-media-scrim/80 border-on-media/10 hover:border-on-media/20 text-on-media hover:text-on-media"
            >
              <ChevronRight size={18} aria-hidden />
            </Button>
            <div
              aria-hidden
              className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 font-mono text-[11px] tracking-[1px] text-on-media bg-media-scrim px-2 py-0.5"
            >
              {index + 1} / {total}
            </div>
          </>
        )}

        {/* Posición para lectores de pantalla — el contador visual va oculto. */}
        <div id={galleryId} className="sr-only" aria-live="polite" aria-atomic="true">
          {hasMultiple ? `Imagen ${index + 1} de ${total}` : ''}
        </div>

        {children}
      </div>

      {hasMultiple && (
        <div className={cn('flex gap-2 overflow-x-auto', thumbsWrapperClassName)}>
          {images.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Ver imagen ${i + 1} de ${total}`}
              aria-current={i === index ? 'true' : undefined}
              className={cn(
                'relative shrink-0 overflow-hidden border transition-colors duration-200',
                thumbClassName ?? 'w-14 h-14 sm:w-16 sm:h-16',
                i === index ? 'border-(--gold) border-2' : 'border-(--bd) hover:border-(--bdh)',
              )}
            >
              {/* alt="" — el nombre accesible lo da el aria-label del botón */}
              <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && total > 0 && (
        <Lightbox
          images={images}
          name={name}
          initialIndex={index}
          onClose={(lastIndex) => {
            setLightboxOpen(false)
            goTo(lastIndex)
          }}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Visor a pantalla completa
// ---------------------------------------------------------------------------

function Lightbox({
  images,
  name,
  initialIndex,
  onClose,
}: {
  images: CarouselImage[]
  name: string
  initialIndex: number
  onClose: (lastIndex: number) => void
}) {
  const [index, setIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null)
  const panelRef = useFocusTrap<HTMLDivElement>(true)
  const titleId = useId()
  const total = images.length
  const img = images[index]
  useScrollLock(true)

  const go = (delta: number) => {
    setZoom(null)
    setIndex((i) => (i + delta + total) % total)
  }

  // Escape se maneja aquí y NO se propaga: si la galería vive dentro del
  // ProductModal, su listener de `window` cerraría también el modal.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose(index)
    } else if (e.key === 'ArrowLeft' && total > 1) {
      e.preventDefault()
      go(-1)
    } else if (e.key === 'ArrowRight' && total > 1) {
      e.preventDefault()
      go(1)
    }
  }

  return createPortal(
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-600 bg-surface-950/95 text-on-media flex flex-col animate-fade-in"
    >
      <div className="flex items-center justify-between gap-3 px-4 h-16 shrink-0">
        <h2 id={titleId} className="font-display text-[15px] font-bold uppercase tracking-[1px] truncate">
          {name}
          {total > 1 && (
            <span className="ml-3 font-mono text-[12px] opacity-75" aria-live="polite">
              {index + 1} / {total}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="icon"
            size="md"
            onClick={() => setZoom((z) => (z ? null : { x: 50, y: 50 }))}
            aria-label={zoom ? 'Alejar' : 'Acercar'}
            aria-pressed={zoom !== null}
            className="border-on-media/20 text-on-media hover:text-on-media"
          >
            {zoom ? <ZoomOut size={18} aria-hidden /> : <ZoomIn size={18} aria-hidden />}
          </Button>
          <Button
            variant="icon"
            size="md"
            onClick={() => onClose(index)}
            aria-label="Cerrar visor"
            className="border-on-media/20 text-on-media hover:text-on-media"
          >
            <X size={18} aria-hidden />
          </Button>
        </div>
      </div>

      <div className="relative flex-1 min-h-0 overflow-hidden">
        {/* Click en la foto alterna el zoom 2× centrado en el punto tocado.
            Con teclado el mismo zoom está en el botón de la barra superior. */}
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div
          onClick={(e) => {
            if (zoom) return setZoom(null)
            const r = e.currentTarget.getBoundingClientRect()
            setZoom({
              x: ((e.clientX - r.left) / r.width) * 100,
              y: ((e.clientY - r.top) / r.height) * 100,
            })
          }}
          className={cn('absolute inset-0', zoom ? 'cursor-zoom-out' : 'cursor-zoom-in')}
        >
          <Image
            key={img.url}
            src={img.url}
            alt={altFor(img, name, index)}
            fill
            sizes="100vw"
            className="object-contain transition-transform duration-300"
            style={
              zoom
                ? { transform: 'scale(2)', transformOrigin: `${zoom.x}% ${zoom.y}%` }
                : undefined
            }
          />
        </div>

        {total > 1 && (
          <>
            <Button
              variant="icon"
              size="lg"
              onClick={() => go(-1)}
              aria-label="Imagen anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-media-scrim/70 border-on-media/20 text-on-media hover:text-on-media"
            >
              <ChevronLeft size={22} aria-hidden />
            </Button>
            <Button
              variant="icon"
              size="lg"
              onClick={() => go(1)}
              aria-label="Imagen siguiente"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-media-scrim/70 border-on-media/20 text-on-media hover:text-on-media"
            >
              <ChevronRight size={22} aria-hidden />
            </Button>
          </>
        )}
      </div>
      <div className="h-[env(safe-area-inset-bottom)] shrink-0" />
    </div>,
    document.body,
  )
}
