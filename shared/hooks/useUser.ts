'use client'

import { useSession } from 'next-auth/react'
import { useMemo } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UserRole = 'admin' | 'customer'
export type SessionUser = { name: string; email: string; role: UserRole }

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Devuelve el usuario autenticado leyendo la cookie JWT de NextAuth.
 * El `role` viene incrustado en el token (callback `jwt` en auth.ts).
 *
 * - `isLoading` es true mientras NextAuth resuelve la sesión.
 * - `user` es null cuando no hay sesión activa.
 */
export function useUser(): { user: SessionUser | null; isLoading: boolean } {
  const { data: session, status } = useSession()

  const name = session?.user?.name
  const email = session?.user?.email
  const role = session?.user?.role

  // Memoizado por valores primitivos: useSession() puede devolver un objeto
  // `session` con nueva referencia en cada render sin que los datos cambien,
  // y un `user` inestable rompe los useEffect que dependen de él (loop de
  // fetch en CheckoutView).
  const user = useMemo<SessionUser | null>(() => {
    if (!email) return null
    return {
      name: name ?? email.split('@')[0],
      email,
      role: role ?? 'customer',
    }
  }, [name, email, role])

  if (status === 'loading') return { user: null, isLoading: true }
  if (status !== 'authenticated' || !email) return { user: null, isLoading: false }

  return { user, isLoading: false }
}
