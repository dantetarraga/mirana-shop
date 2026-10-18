'use client'

import { BannerImage } from '@/features/banners/components/BannerImage'
import {
  bannerFullImage,
  bannerMobileImage,
  hasBannerImage,
} from '@/features/banners/lib/banner-image'
import type { BannerRow } from '@/features/banners/types'
import { HeroAutoplayToggle } from '@/features/home/components/HeroAutoplayToggle'
import { useHeroAutoplay } from '@/features/home/components/useHeroAutoplay'
import Link from 'next/link'
import { safeHref } from '@/shared/schemas/safe-url.schema'
import { useCallback, useState } from 'react'

/** Debe coincidir con la `duration-[900ms]` de las diapositivas. */
const FADE_MS = 900

const DESKTOP_SIZE = { width: 1920, height: 900 }
const MOBILE_SIZE = { width: 1080, height: 1350 }

interface HeroBannerFadeProps {
  banners: BannerRow[]
}

/**
 * Hero a ancho completo: las imágenes se apilan y se cruzan por opacidad —
 * no hay desplazamiento, así que no es un carrusel. El texto y el botón del
 * banner activo entran con `animate-fade-up`.
 *
 * Se implementa a mano en vez de con Embla porque el efecto es un stack
 * absoluto con `opacity`: arrastrar el DOM de slides (flex + transform) de un
 * carrusel solo para desactivar su desplazamiento sale más caro y más frágil.
 */
export function HeroBannerFade({ banners: allBanners }: HeroBannerFadeProps) {
  const [index, setIndex] = useState(0)

  // Un banner sin ninguna imagen no se puede pintar: se descarta aunque esté
  // activo. getActiveBanners ya lo hace; esto cubre a cualquier otro llamador.
  const banners = allBanners.filter(hasBannerImage)
  const total = banners.length

  // Cada banner queda visible HERO_AUTOPLAY_MS antes de fundirse al siguiente.
  // Con un solo banner no hay nada que alternar: ni intervalo ni controles.
  const { canAutoplay, userPaused, togglePaused, regionProps } = useHeroAutoplay({
    enabled: total > 1,
    onTick: () => setIndex((i) => (i + 1) % total),
  })

  const goTo = useCallback((i: number) => setIndex(i), [])

  if (total === 0) return null

  return (
    // Pausa el avance automático al pasar el mouse y al enfocar con teclado.
    // La regla avisa de interacción sobre un elemento no interactivo, pero aquí
    // no hay ninguna acción exclusiva del mouse: solo detiene el temporizador,
    // y onFocus/onBlur cubren el equivalente de teclado.
    <section
      className="relative w-full overflow-hidden h-[clamp(420px,70vh,760px)] bg-card"
      aria-roledescription="carrusel"
      aria-label="Banners destacados"
      {...regionProps}
    >
      {banners.map((banner, i) => {
        const isActive = i === index
        return (
          <div
            key={banner.id}
            aria-hidden={!isActive}
            // `inert` evita que el teclado alcance el enlace de una diapositiva
            // invisible; sin él el foco se perdería en contenido oculto.
            inert={!isActive}
            className={`absolute inset-0 transition-opacity ease-in-out ${
              isActive ? 'opacity-100 z-1' : 'opacity-0 z-0 pointer-events-none'
            }`}
            style={{ transitionDuration: `${FADE_MS}ms` }}
          >
            <BannerImage
              // La imagen dedicada al hero es opcional: sin ella se cae a la
              // de tarjeta, que es más baja pero encuadra igual con object-cover.
              // `!` es seguro porque `banners` ya viene filtrado (ver abajo).
              desktopUrl={bannerFullImage(banner)!}
              mobileUrl={bannerMobileImage(banner)}
              // Sin título el banner es decorativo: alt vacío.
              alt={banner.title ?? ''}
              sizes="100vw"
              priority={i === 0}
              desktopSize={DESKTOP_SIZE}
              mobileSize={MOBILE_SIZE}
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Velo oscuro en ambos temas: debajo hay una foto, no una superficie */}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-media-scrim via-media-scrim/35 to-transparent pointer-events-none"
            />

            {isActive && (
              // La `key` por índice reinicia animate-fade-up en cada cambio,
              // así el texto y el botón entran de nuevo con cada banner.
              <div
                key={index}
                className="animate-fade-up relative z-1 h-full shell flex flex-col items-start justify-end pb-14 sm:pb-16 md:pb-20 max-w-4xl"
              >
                {banner.title && (
                  <h2 className="font-display font-black uppercase tracking-[-1px] leading-[0.95] text-[clamp(32px,6vw,72px)] text-on-media">
                    {banner.title}
                  </h2>
                )}
                {banner.subtitle && (
                  <p className="mt-3 text-[clamp(14px,1.5vw,18px)] font-light text-on-media/80 max-w-2xl">
                    {banner.subtitle}
                  </p>
                )}
                <Link
                  href={safeHref(banner.ctaHref, '/catalogo')}
                  className="mt-7 inline-block no-underline bg-(--gold) text-on-accent font-display font-extrabold uppercase text-[13px] sm:text-[15px] tracking-[2px] px-8 sm:px-10 py-3.5 sm:py-4 transition-[background-color,transform,box-shadow] duration-200 hover:bg-(--gl) hover:-translate-y-0.5 hover:shadow-gold"
                >
                  {banner.ctaLabel || 'Comprar ahora'}
                </Link>
              </div>
            )}
          </div>
        )
      })}

      {total > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-2 flex items-center gap-2">
          {canAutoplay && <HeroAutoplayToggle paused={userPaused} onToggle={togglePaused} />}
          <div className="flex">
            {banners.map((banner, i) => (
              <button
                key={banner.id}
                type="button"
                aria-label={banner.title ? `Ir al banner ${i + 1}: ${banner.title}` : `Ir al banner ${i + 1}`}
                aria-current={i === index ? 'true' : undefined}
                onClick={() => goTo(i)}
                // Área táctil de 44px; la barrita visible sigue siendo fina.
                className="group/dot h-11 px-1 flex items-center border-none bg-transparent"
              >
                <span
                  aria-hidden
                  className={`block h-1.5 transition-[width,background-color] duration-300 ${
                    i === index ? 'w-8 bg-(--gold)' : 'w-3 bg-on-media/40 group-hover/dot:bg-on-media/70'
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
