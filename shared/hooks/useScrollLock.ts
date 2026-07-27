'use client'

import { useEffect } from 'react'

// ---------------------------------------------------------------------------
// useScrollLock — bloquea el scroll del fondo contando bloqueos anidados.
//
// Antes cada diálogo escribía `document.body.style.overflow` a mano. El
// ConfirmModal vive dentro del CartDrawer, así que al cancelarlo su efecto
// ponía `overflow = ''` con el drawer todavía abierto y el fondo volvía a
// scrollear. Con un contador, el scroll solo se libera cuando se cierra el
// último bloqueo.
// ---------------------------------------------------------------------------

let locks = 0
let previousOverflow = ''

export function useScrollLock(active = true) {
  useEffect(() => {
    if (!active) return

    if (locks === 0) {
      previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    locks += 1

    return () => {
      locks -= 1
      if (locks === 0) document.body.style.overflow = previousOverflow
    }
  }, [active])
}
