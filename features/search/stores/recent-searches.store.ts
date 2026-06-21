import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ---------------------------------------------------------------------------
// Store de UI — búsquedas recientes del buscador principal, persistidas en
// localStorage (único store del proyecto con `persist`: es preferencia local
// del navegador, no estado de negocio — no necesita vivir en la BD).
// ---------------------------------------------------------------------------

const MAX_RECENT = 6

interface RecentSearchesState {
  terms: string[]
  addTerm: (term: string) => void
  removeTerm: (term: string) => void
  clear: () => void
}

export const useRecentSearchesStore = create<RecentSearchesState>()(
  persist(
    (set) => ({
      terms: [],
      addTerm: (term) => {
        const clean = term.trim()
        if (!clean) return
        set((state) => ({
          terms: [clean, ...state.terms.filter((t) => t.toLowerCase() !== clean.toLowerCase())].slice(
            0,
            MAX_RECENT,
          ),
        }))
      },
      removeTerm: (term) => set((state) => ({ terms: state.terms.filter((t) => t !== term) })),
      clear: () => set({ terms: [] }),
    }),
    { name: 'mirana-recent-searches' },
  ),
)
