import { create } from 'zustand'

// ---------------------------------------------------------------------------
// Store de UI — controla el off-canvas del sidebar admin en mobile/tablet.
// En desktop (lg+) el sidebar es estático y este estado se ignora.
// ---------------------------------------------------------------------------

interface AdminSidebarState {
  isOpen: boolean
  toggle: () => void
  close: () => void
}

export const useAdminSidebarStore = create<AdminSidebarState>((set) => ({
  isOpen: false,
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  close: () => set({ isOpen: false }),
}))
