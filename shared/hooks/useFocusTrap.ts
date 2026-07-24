'use client'

import { useEffect, useRef } from 'react'

// ---------------------------------------------------------------------------
// useFocusTrap — atrapa el foco dentro de un contenedor mientras está activo.
//
// - Enfoca el primer elemento focusable al montar (o el contenedor).
// - Cicla Tab / Shift+Tab dentro del contenedor.
// - Restaura el foco al elemento que lo tenía antes, al desmontar.
//
// Uso:
//   const ref = useFocusTrap<HTMLDivElement>(open)
//   <div ref={ref} role="dialog" aria-modal="true"> … </div>
//
// Antes ningún diálogo del sitio atrapaba el foco (`tabIndex` no aparecía ni
// una vez en el repo): con Tab se salía del modal hacia el fondo inerte.
// ---------------------------------------------------------------------------

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useFocusTrap<T extends HTMLElement>(active = true) {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!active) return
    const container = ref.current
    if (!container) return

    const previouslyFocused = document.activeElement as HTMLElement | null

    const focusables = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      )

    // Foco inicial: primer focusable, o el contenedor mismo.
    const first = focusables()[0]
    if (first) first.focus()
    else {
      container.setAttribute('tabindex', '-1')
      container.focus()
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      const activeEl = document.activeElement

      if (e.shiftKey && activeEl === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && activeEl === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }

    container.addEventListener('keydown', onKeyDown)
    return () => {
      container.removeEventListener('keydown', onKeyDown)
      // Restaura el foco solo si sigue en el documento (no se navegó fuera).
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus()
      }
    }
  }, [active])

  return ref
}
