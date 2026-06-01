import type { CatalogProduct } from '@/shared/types/catalog.types'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UserRole = 'admin' | 'customer'
export type CartItem = { product: CatalogProduct; qty: number }
export type User = { name: string; email: string; role: UserRole }

interface StoreState {
  // --- Hydration ---
  _hasHydrated: boolean
  _setHasHydrated: (v: boolean) => void

  // --- Cart ---
  cart: CartItem[]
  cartCount: number
  cartOpen: boolean
  addToCart: (product: CatalogProduct, qty?: number) => void
  updateQty: (id: string, delta: number) => void
  removeItem: (id: string) => void
  setCartOpen: (open: boolean) => void

  // --- Auth ---
  user: User | null
  authOpen: boolean
  authMode: 'login' | 'register'
  openAuth: (mode: 'login' | 'register') => void
  closeAuth: () => void
  authenticate: (user: Omit<User, 'role'>) => void
  logout: () => void

  // --- Product modal ---
  activeProduct: CatalogProduct | null
  openProductModal: (product: CatalogProduct) => void
  closeProductModal: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ADMIN_EMAILS = ['admin@mirana.com', 'admin']

function countCart(cart: CartItem[]) {
  return cart.reduce((s, i) => s + i.qty, 0)
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      // hydration
      _hasHydrated: false,
      _setHasHydrated: (v) => set({ _hasHydrated: v }),

      // cart
      cart: [],
      cartCount: 0,
      cartOpen: false,

      addToCart: (product, qty = 1) =>
        set((s) => {
          const ex = s.cart.find((i) => i.product.id === product.id)
          const cart = ex
            ? s.cart.map((i) => (i.product.id === product.id ? { ...i, qty: i.qty + qty } : i))
            : [...s.cart, { product, qty }]
          return { cart, cartCount: countCart(cart) }
        }),

      updateQty: (id, delta) =>
        set((s) => {
          const cart = s.cart.map((i) =>
            i.product.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i,
          )
          return { cart, cartCount: countCart(cart) }
        }),

      removeItem: (id) =>
        set((s) => {
          const cart = s.cart.filter((i) => i.product.id !== id)
          return { cart, cartCount: countCart(cart) }
        }),

      setCartOpen: (open) => set({ cartOpen: open }),

      // auth
      user: null,
      authOpen: false,
      authMode: 'login',

      openAuth: (mode) => set({ authMode: mode, authOpen: true }),
      closeAuth: () => set({ authOpen: false }),
      authenticate: (u) => {
        const isAdmin = ADMIN_EMAILS.some((e) => u.email.toLowerCase().includes(e))
        set({ user: { ...u, role: isAdmin ? 'admin' : 'customer' }, authOpen: false })
        // Set session cookie so middleware can protect /cuenta/* routes
        if (typeof document !== 'undefined') {
          document.cookie = 'm-auth=1; path=/; max-age=604800; samesite=lax'
        }
      },
      logout: () => {
        set({ user: null })
        // Clear session cookie
        if (typeof document !== 'undefined') {
          document.cookie = 'm-auth=; path=/; max-age=0; samesite=lax'
        }
      },

      // product modal
      activeProduct: null,
      openProductModal: (product) => set({ activeProduct: product }),
      closeProductModal: () => set({ activeProduct: null }),
    }),
    {
      name: 'm-store',
      storage: createJSONStorage(() => localStorage),
      // Solo persistir cart + user, no estado de UI
      partialize: (s) => ({ cart: s.cart, cartCount: s.cartCount, user: s.user }),
      onRehydrateStorage: () => (state) => {
        state?._setHasHydrated(true)
        // Re-sync cookie on hydration (covers existing sessions)
        if (state?.user && typeof document !== 'undefined') {
          document.cookie = 'm-auth=1; path=/; max-age=604800; samesite=lax'
        }
      },
    },
  ),
)
