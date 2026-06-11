'use client'

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

/**
 * Sincroniza la sesión de NextAuth con la cookie `m-auth` que el middleware
 * puede usar para proteger rutas fuera del matcher de NextAuth.
 *
 * La fuente de verdad de sesión es la cookie JWT de NextAuth
 * (`next-auth.session-token`), NO Zustand.
 */
export function SessionSync() {
  const { status } = useSession()

  useEffect(() => {
    if (typeof document === 'undefined') return

    if (status === 'authenticated') {
      document.cookie = 'm-auth=1; path=/; max-age=604800; samesite=lax'
    } else if (status === 'unauthenticated') {
      document.cookie = 'm-auth=; path=/; max-age=0; samesite=lax'
    }
  }, [status])

  return null
}
