'use client'

import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import { useCallback, useEffect, useRef, useState, type FocusEvent } from 'react'

/**
 * Avance automático de los heros del inicio. El cliente pidió 2–3 s; se usa el
 * extremo alto para que el título y el botón alcancen a leerse.
 */
export const HERO_AUTOPLAY_MS = 3000

/** Marca el botón de pausa: enfocarlo no debe congelar el carrusel. */
export const AUTOPLAY_TOGGLE_ATTR = 'data-autoplay-toggle'

interface UseHeroAutoplayOptions {
  /** Hay más de una vista que alternar. */
  enabled: boolean
  /** Avanza a la siguiente vista (con vuelta al inicio). */
  onTick: () => void
  intervalMs?: number
}

/**
 * Temporizador compartido por los tres heros (tarjetas, pantalla completa y
 * editorial). Se detiene:
 *  - con el mouse encima y con el foco de teclado dentro del carrusel,
 *  - con la pestaña oculta (al volver no hay saltos acumulados),
 *  - si el usuario lo pausa con el botón (WCAG 2.2.2),
 *  - y nunca arranca con `prefers-reduced-motion` (la regla CSS global no puede
 *    detener un setInterval).
 */
export function useHeroAutoplay({
  enabled,
  onTick,
  intervalMs = HERO_AUTOPLAY_MS,
}: UseHeroAutoplayOptions) {
  const reducedMotion = useReducedMotion()
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [hiddenTab, setHiddenTab] = useState(false)
  const [userPaused, setUserPaused] = useState(false)

  const canAutoplay = enabled && !reducedMotion
  const running = canAutoplay && !hovered && !focused && !hiddenTab && !userPaused

  // El callback cambia en cada render (depende del API de Embla o del índice):
  // se guarda en un ref para no reiniciar el intervalo con cada render.
  const tickRef = useRef(onTick)
  useEffect(() => {
    tickRef.current = onTick
  }, [onTick])

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => tickRef.current(), intervalMs)
    return () => clearInterval(id)
  }, [running, intervalMs])

  useEffect(() => {
    if (!canAutoplay) return
    const onVisibility = () => setHiddenTab(document.visibilityState === 'hidden')
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [canAutoplay])

  const togglePaused = useCallback(() => setUserPaused((p) => !p), [])

  /** Se esparcen en el <section> del carrusel. */
  const regionProps = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onFocus: (e: FocusEvent<HTMLElement>) => {
      // El foco en el propio botón de pausa no cuenta: si no, "Reanudar"
      // nunca reanudaría mientras el botón siga enfocado.
      setFocused(!(e.target as HTMLElement).closest(`[${AUTOPLAY_TOGGLE_ATTR}]`))
    },
    onBlur: (e: FocusEvent<HTMLElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
    },
  }

  return { canAutoplay, running, userPaused, togglePaused, regionProps }
}
