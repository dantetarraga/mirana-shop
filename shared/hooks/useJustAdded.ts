'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/** Cuánto dura la confirmación en el botón antes de volver a su estado normal. */
export const JUST_ADDED_MS = 1800

/**
 * Confirmación efímera para botones de acción: tras `trigger()` devuelve
 * `justAdded = true` durante un momento y luego vuelve solo a `false`.
 *
 * Se usa en los botones de añadir al carrito para que el propio botón indique
 * el resultado (texto + color + check), sin depender solo del toast.
 */
export function useJustAdded(duration = JUST_ADDED_MS) {
  const [justAdded, setJustAdded] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }, [])

  const trigger = useCallback(() => {
    // Al añadir de nuevo antes de que expire, se reinicia la cuenta en vez de
    // apagarse a medias.
    clear()
    setJustAdded(true)
    timer.current = setTimeout(() => setJustAdded(false), duration)
  }, [clear, duration])

  // Evita el setState sobre un componente ya desmontado (ej. la tarjeta sale
  // de la lista al filtrar justo después de añadir).
  useEffect(() => clear, [clear])

  return { justAdded, trigger }
}
