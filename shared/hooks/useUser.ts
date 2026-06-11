'use client'

import { useSession } from 'next-auth/react'

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

  if (status === 'loading') return { user: null, isLoading: true }
  if (status !== 'authenticated' || !session?.user?.email) return { user: null, isLoading: false }

  return {
    user: {
      name: session.user.name ?? session.user.email.split('@')[0],
      email: session.user.email,
      role: session.user.role ?? 'customer',
    },
    isLoading: false,
  }
}
