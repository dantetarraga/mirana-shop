'use client'

import { useStore } from '@/shared/lib/store-context'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

/**
 * Sincroniza la sesión de NextAuth con el store de Zustand.
 * Debe estar dentro de <SessionProvider> y <StoreProvider>.
 */
export function SessionSync() {
  const { data: session, status } = useSession()
  const { authenticate, logout, user, _hasHydrated } = useStore()

  useEffect(() => {
    if (!_hasHydrated) return

    if (status === 'authenticated' && session?.user?.email) {
      if (!user) {
        authenticate({
          name: session.user.name ?? session.user.email.split('@')[0],
          email: session.user.email,
        })
      }
    } else if (status === 'unauthenticated' && user) {
      logout()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, _hasHydrated])

  return null
}
