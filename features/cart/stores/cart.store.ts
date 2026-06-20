import type { CatalogProduct } from '@/features/products/types/catalog.types'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CartItem = { product: CatalogProduct; qty: number }

interface CartState {
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
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countCart(cart: CartItem[]) {
  return cart.reduce((s, i) => s + i.qty, 0)
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useCartStore = create<CartState>()(
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
    }),
    {
      name: 'm-store',
      storage: createJSONStorage(() => localStorage),
      // Solo persistir cart — la sesión de usuario viene de NextAuth (cookie JWT)
      partialize: (s) => ({ cart: s.cart, cartCount: s.cartCount }),
      onRehydrateStorage: () => (state) => {
        state?._setHasHydrated(true)
      },
    },
  ),
)
