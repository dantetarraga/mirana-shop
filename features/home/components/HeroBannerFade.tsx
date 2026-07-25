'use client'

import { BannerImage } from '@/features/banners/components/BannerImage'
import type { BannerRow } from '@/features/banners/types'
import { useReducedMotion } from '@/shared/hooks'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

/** Tiempo que permanece visible cada banner antes de fundirse al siguiente. */
const INTERVAL_MS = 6000

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
export function HeroBannerFade({ banners }: HeroBannerFadeProps) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const reducedMotion = useReducedMotion()

  const total = banners.length
  // Con un solo banner no hay nada que alternar: ni intervalo ni controles.
  const isStatic = total <= 1 || reducedMotion

  useEffect(() => {
    if (isStatic || paused) return
    const id = setInterval(() => setIndex((i) => (i + 1) % total), INTERVAL_MS)
    return () => clearInterval(id)
  }, [isStatic, paused, total])

  // En una pestaña oculta el intervalo seguiría corriendo y al volver se vería
  // un salto brusco: se congela mientras no está visible.
  useEffect(() => {
    if (isStatic) return
    const onVisibility = () => setPaused(document.visibilityState === 'hidden')
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [isStatic])

  const goTo = useCallback((i: number) => setIndex(i), [])

  if (total === 0) return null

  return (
    // Pausa el avance automático al pasar el mouse y al enfocar con teclado.
    // La regla avisa de interacción sobre un elemento no interactivo, pero aquí
    // no hay ninguna acción exclusiva del mouse: solo detiene el temporizador,
    // y onFocus/onBlur cubren el equivalente de teclado.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <section
      className="relative w-full overflow-hidden h-[clamp(420px,70vh,760px)] bg-card"
      aria-roledescription="carrusel"
      aria-label="Banners destacados"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
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
              desktopUrl={banner.imageUrl}
              mobileUrl={banner.imageUrlMobile}
              alt={banner.title}
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
                <h2 className="font-display font-black uppercase tracking-[-1px] leading-[0.95] text-[clamp(32px,6vw,72px)] text-on-media">
                  {banner.title}
                </h2>
                {banner.subtitle && (
                  <p className="mt-3 text-[clamp(14px,1.5vw,18px)] font-light text-on-media/80 max-w-2xl">
                    {banner.subtitle}
                  </p>
                )}
                <Link
                  href={banner.ctaHref || '/catalogo'}
                  className="mt-7 inline-block no-underline bg-(--gold) text-on-accent font-display font-extrabold uppercase text-[13px] sm:text-[15px] tracking-[2px] px-8 sm:px-10 py-3.5 sm:py-4 transition-all duration-200 hover:bg-(--gl) hover:-translate-y-0.5 hover:shadow-gold"
                >
                  {banner.ctaLabel || 'Comprar ahora'}
                </Link>
              </div>
            )}
          </div>
        )
      })}

      {total > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-2 flex gap-2">
          {banners.map((banner, i) => (
            <button
              key={banner.id}
              type="button"
              aria-label={`Ir al banner ${i + 1}: ${banner.title}`}
              aria-current={i === index}
              onClick={() => goTo(i)}
              className={`h-1.5 border-none transition-all duration-300 ${
                i === index ? 'w-8 bg-(--gold)' : 'w-3 bg-on-media/40 hover:bg-on-media/70'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
