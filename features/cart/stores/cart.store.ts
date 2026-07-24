import {
  addCartItemAction,
  clearCartAction,
  getCartAction,
  removeCartItemAction,
  updateCartItemQtyAction,
} from '@/features/cart/actions/cart.actions'
import type { CartLine } from '@/features/cart/types'
import {
  maxPurchasable,
  remainingStock,
  stockLimitMessage,
} from '@/features/products/lib/stock'
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
  /** Agrega respetando el stock. Devuelve cuántas unidades entraron (0 = tope). */
  addToCart: (product: CatalogProduct, qty?: number) => number
  /** Ajusta la cantidad respetando el stock. Devuelve si hubo cambio. */
  updateQty: (id: string, delta: number) => boolean
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

export const useCartStore = create<CartState>()((set, get) => ({
  cart: [],
  cartCount: 0,
  cartOpen: false,

  hydrateCart: (items) => set({ cart: items, cartCount: countCart(items) }),

  addToCart: (product, qty = 1) => {
    const inCart = get().cart.find((i) => i.product.id === product.id)?.qty ?? 0
    const remaining = remainingStock(product, inCart)
    const toAdd = remaining === null ? qty : Math.min(qty, remaining)

    if (toAdd <= 0) {
      toast.warning(stockLimitMessage(product.name))
      return 0
    }

    set((s) => {
      const ex = s.cart.find((i) => i.product.id === product.id)
      const cart = ex
        ? s.cart.map((i) => (i.product.id === product.id ? { ...i, qty: i.qty + toAdd } : i))
        : [...s.cart, { product, qty: toAdd }]
      return { cart, cartCount: countCart(cart) }
    })
    addCartItemAction(product.id, toAdd)
      .then((cart) => set({ cart, cartCount: countCart(cart) }))
      .catch(() => resync(set))

    return toAdd
  },

  updateQty: (id, delta) => {
    const item = get().cart.find((i) => i.product.id === id)
    if (!item) return false

    const max = maxPurchasable(item.product)
    const next = Math.max(1, item.qty + delta)

    if (max !== null && next > max) {
      toast.warning(stockLimitMessage(item.product.name))
      return false
    }
    if (next === item.qty) return false

    set((s) => {
      const cart = s.cart.map((i) => (i.product.id === id ? { ...i, qty: next } : i))
      return { cart, cartCount: countCart(cart) }
    })
    updateCartItemQtyAction(id, delta)
      .then((cart) => set({ cart, cartCount: countCart(cart) }))
      .catch(() => resync(set))

    return true
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
