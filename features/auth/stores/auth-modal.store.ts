import { create } from 'zustand'

// ---------------------------------------------------------------------------
// Store de UI — controla el modal de login/registro (no persiste nada;
// la sesión real vive en la cookie JWT de NextAuth).
// ---------------------------------------------------------------------------

interface AuthModalState {
  authOpen: boolean
  authMode: 'login' | 'register'
  openAuth: (mode: 'login' | 'register') => void
  closeAuth: () => void
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  authOpen: false,
  authMode: 'login',
  openAuth: (mode) => set({ authMode: mode, authOpen: true }),
  closeAuth: () => set({ authOpen: false }),
}))
