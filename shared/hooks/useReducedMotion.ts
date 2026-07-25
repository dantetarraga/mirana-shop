'use client'

import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

const getSnapshot = () => window.matchMedia(QUERY).matches

// En servidor se asume que sí hay movimiento: es lo que ve la mayoría y evita
// que el primer render difiera del cliente en el caso habitual.
const getServerSnapshot = () => false

/**
 * `true` si el sistema pide reducir el movimiento.
 *
 * La regla global de globals.css ya neutraliza transiciones y animaciones CSS,
 * pero no puede detener un `setInterval`: sin esto los carruseles seguirían
 * avanzando solos (de golpe, sin fundido) para quien pidió no tener movimiento.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
