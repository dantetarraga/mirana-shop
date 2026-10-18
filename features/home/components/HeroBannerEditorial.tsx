'use client'

import { BannerImage } from '@/features/banners/components/BannerImage'
import { bannerFullImage, bannerMobileImage } from '@/features/banners/lib/banner-image'
import type { BannerRow } from '@/features/banners/types'
import { HeroAutoplayToggle } from '@/features/home/components/HeroAutoplayToggle'
import { useHeroAutoplay } from '@/features/home/components/useHeroAutoplay'
import { safeHref } from '@/shared/schemas/safe-url.schema'
import useEmblaCarousel from 'embla-carousel-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

// Medidas que se piden a next/image; coinciden con las recomendadas en el
// formulario de banners y en /admin/settings.
const DESKTOP_SIZE = { width: 1920, height: 800 }
const MOBILE_SIZE = { width: 1080, height: 1350 }

interface HeroBannerEditorialProps {
  banners: BannerRow[]
}

type EditorialSlide = {
  id: string
  title: string | null
  subtitle: string | null
  desktopUrl: string
  mobileUrl: string | null
  ctaLabel: string
  ctaHref: string
}

function toSlides(banners: BannerRow[]): EditorialSlide[] {
  return banners.flatMap((b) => {
    const desktopUrl = bannerFullImage(b)
    if (!desktopUrl) return []
    return [
      {
        id: b.id,
        title: b.title,
        subtitle: b.subtitle,
        desktopUrl,
        mobileUrl: bannerMobileImage(b),
        ctaLabel: b.ctaLabel || 'Comprar ahora',
        ctaHref: safeHref(b.ctaHref, '/catalogo'),
      },
    ]
  })
}

/**
 * Hero editorial: la foto ocupa todo el ancho y el texto del banner (título,
 * subtítulo y botón) se apoya en un velo a la izquierda en desktop y en la
 * parte baja en móvil. El velo es `media-scrim` (oscuro en ambos temas) con
 * dos capas, así el texto blanco conserva contraste AA aunque la foto sea
 * clara. Se desliza con Embla: en móvil se puede arrastrar con el dedo.
 */
export function HeroBannerEditorial({ banners }: HeroBannerEditorialProps) {
  const slides = toSlides(banners)
  const total = slides.length

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: total > 1, duration: 28 })
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap())
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi])

  const next = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  const { canAutoplay, running, userPaused, togglePaused, regionProps } = useHeroAutoplay({
    enabled: total > 1,
    onTick: next,
  })

  if (total === 0) return null

  return (
    // Hover/foco solo detienen el temporizador; no hay acción exclusiva del mouse.
    <section
      className="relative overflow-hidden bg-(--brand-navy)"
      aria-roledescription="carrusel"
      aria-label="Banners destacados"
      {...regionProps}
    >
      <div ref={emblaRef} className="overflow-hidden">
        {/* Mientras avanza solo no se anuncia cada cambio; pausado, sí. */}
        <div className="flex" aria-live={running ? 'off' : 'polite'}>
          {slides.map((slide, i) => {
            const isActive = i === selected
            return (
              <div
                key={slide.id}
                role="group"
                aria-roledescription="diapositiva"
                aria-label={`${i + 1} de ${total}`}
                aria-hidden={!isActive}
                // Las vistas fuera de pantalla no deben recibir el foco del teclado.
                inert={!isActive}
                className="relative flex-none w-full min-w-0 h-[min(125vw,640px)] lg:h-[clamp(440px,41.7vw,720px)]"
              >
                <BannerImage
                  desktopUrl={slide.desktopUrl}
                  mobileUrl={slide.mobileUrl}
                  alt={slide.title ?? ''}
                  sizes="100vw"
                  priority={i === 0}
                  desktopSize={DESKTOP_SIZE}
                  mobileSize={MOBILE_SIZE}
                  // En desktop el motivo de la foto va a la derecha: si el
                  // viewport recorta, se recorta el lado del texto.
                  className="absolute inset-0 w-full h-full object-cover object-top lg:object-right"
                />

                {/* Velo: desde abajo en móvil, desde la izquierda en desktop */}
                <div
                  aria-hidden
                  className="absolute inset-0 pointer-events-none bg-linear-to-t from-media-scrim from-30% via-media-scrim/70 via-55% to-transparent to-85% lg:bg-linear-to-r lg:from-15% lg:via-45% lg:to-70%"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 pointer-events-none bg-linear-to-t from-media-scrim to-transparent to-45% lg:bg-linear-to-r lg:to-50%"
                />

                <div className="relative z-1 h-full shell flex flex-col justify-end lg:justify-center pb-20 lg:pb-0">
                  <div className="max-w-[34rem] lg:max-w-[44%]">
                    {slide.title && (
                      <h2 className="font-display font-black uppercase leading-[0.9] tracking-[-0.5px] text-on-media text-[clamp(38px,9vw,56px)] lg:text-[clamp(52px,5.4vw,88px)] text-balance">
                        {slide.title}
                      </h2>
                    )}
                    {slide.subtitle && (
                      <p className="mt-3 lg:mt-5 text-[15px] lg:text-[18px] leading-normal text-on-media/85 max-w-[42ch]">
                        {slide.subtitle}
                      </p>
                    )}
                    <Link
                      href={slide.ctaHref}
                      className="mt-6 lg:mt-8 inline-block no-underline bg-(--gold) text-on-accent font-display font-extrabold uppercase text-[14px] lg:text-[15px] tracking-[2px] px-8 lg:px-10 py-3.5 lg:py-4 transition-[background-color,transform,box-shadow] duration-200 hover:bg-(--gl) hover:-translate-y-0.5 hover:shadow-gold"
                    >
                      {slide.ctaLabel}
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {total > 1 && (
        // Controles alineados con la columna de texto: el ojo ya está ahí.
        <div className="absolute inset-x-0 bottom-3 lg:bottom-6 z-2 shell flex items-center gap-3">
          {canAutoplay && <HeroAutoplayToggle paused={userPaused} onToggle={togglePaused} />}
          <div className="flex">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                aria-label={
                  slide.title ? `Ir al banner ${i + 1}: ${slide.title}` : `Ir al banner ${i + 1}`
                }
                aria-current={i === selected ? 'true' : undefined}
                onClick={() => emblaApi?.scrollTo(i)}
                className="group/dot h-11 px-1 flex items-center border-none bg-transparent"
              >
                <span
                  aria-hidden
                  className={`block h-1.5 transition-[width,background-color] duration-300 ${
                    i === selected
                      ? 'w-8 bg-(--gold)'
                      : 'w-3 bg-on-media/40 group-hover/dot:bg-on-media/70'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
