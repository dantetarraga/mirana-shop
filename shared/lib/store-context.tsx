'use client'

// Re-exports from the Zustand store.
// Kept for backwards-compat — existing code importing from here continues to work.
// New code should import directly from '@/shared/stores/store'.
export { useStore } from '@/shared/stores/store'
export type { CartItem, User, UserRole } from '@/shared/stores/store'

import type { ReactNode } from 'react'

// StoreProvider is a no-op with Zustand (no React Context needed).
// Kept to avoid breaking existing layout imports.
export function StoreProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}
