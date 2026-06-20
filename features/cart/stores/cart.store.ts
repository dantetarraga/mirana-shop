import {
  addCartItemAction,
  clearCartAction,
  getCartAction,
  removeCartItemAction,
  updateCartItemQtyAction,
} from '@/features/cart/actions/cart.actions'
import type { CartLine } from '@/features/cart/types'
import type { CatalogProduct } from '@/features/products/types/catalog.types'
import { create } from 'zustand'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CartItem = CartLine

interface CartState {
  cart: CartItem[]
  cartCount: number
  cartOpen: boolean
  hydrateCart: (items: CartItem[]) => void
  addToCart: (product: CatalogProduct, qty?: number) => void
  updateQty: (id: string, delta: number) => void
  removeItem: (id: string) => void
  clearCart: () => void
  setCartOpen: (open: boolean) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countCart(cart: CartItem[]) {
  return cart.reduce((s, i) => s + i.qty, 0)
}

/** Re-sincroniza con el carrito real del servidor tras un fallo de red/DB. */
function resync(set: (s: Partial<CartState>) => void) {
  toast.error('No se pudo actualizar el carrito')
  getCartAction()
    .then((cart) => set({ cart, cartCount: countCart(cart) }))
    .catch(() => {})
}

// ---------------------------------------------------------------------------
// Store — carrito persistido en servidor (DB), ligado a la cuenta o a una
// cookie de sesión anónima (`shared/lib/cart-session.ts`). Sin localStorage:
// el estado local es solo una caché optimista, la fuente de verdad es la DB.
// ---------------------------------------------------------------------------

export const useCartStore = create<CartState>()((set) => ({
  cart: [],
  cartCount: 0,
  cartOpen: false,

  hydrateCart: (items) => set({ cart: items, cartCount: countCart(items) }),

  addToCart: (product, qty = 1) => {
    set((s) => {
      const ex = s.cart.find((i) => i.product.id === product.id)
      const cart = ex
        ? s.cart.map((i) => (i.product.id === product.id ? { ...i, qty: i.qty + qty } : i))
        : [...s.cart, { product, qty }]
      return { cart, cartCount: countCart(cart) }
    })
    addCartItemAction(product.id, qty)
      .then((cart) => set({ cart, cartCount: countCart(cart) }))
      .catch(() => resync(set))
  },

  updateQty: (id, delta) => {
    set((s) => {
      const cart = s.cart.map((i) =>
        i.product.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i,
      )
      return { cart, cartCount: countCart(cart) }
    })
    updateCartItemQtyAction(id, delta)
      .then((cart) => set({ cart, cartCount: countCart(cart) }))
      .catch(() => resync(set))
  },

  removeItem: (id) => {
    set((s) => {
      const cart = s.cart.filter((i) => i.product.id !== id)
      return { cart, cartCount: countCart(cart) }
    })
    removeCartItemAction(id)
      .then((cart) => set({ cart, cartCount: countCart(cart) }))
      .catch(() => resync(set))
  },

  clearCart: () => {
    set({ cart: [], cartCount: 0 })
    clearCartAction().catch(() => {})
  },

  setCartOpen: (open) => set({ cartOpen: open }),
}))
