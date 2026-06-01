'use client'

import { useStore } from '@/shared/lib/store-context'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Reads ?requireAuth=1 from the URL (set by middleware on protected routes)
 * and opens the login modal automatically.
 */
export function AuthRedirectHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { openAuth } = useStore()

  useEffect(() => {
    if (searchParams.get('requireAuth') === '1') {
      openAuth('login')
      // Clean the param from URL without pushing to history
      const url = new URL(window.location.href)
      url.searchParams.delete('requireAuth')
      router.replace(url.pathname + url.search)
    }
  }, [searchParams, openAuth, router])

  return null
}
