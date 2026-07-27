import {
  addCartItemAction,
  addCartItemsAction,
  clearCartAction,
  getCartAction,
  removeCartItemAction,
  setCartItemQtyAction,
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
  /**
   * `false` hasta que CartHydrator siembra el carrito leído en el servidor.
   * El HTML del SSR siempre sale con el carrito vacío (el store es un singleton
   * de módulo, sembrarlo en servidor filtraría el carrito entre requests), así
   * que quien muestre cantidades debe esperar a esta bandera en vez de afirmar
   * "0 unidades" durante el primer pintado.
   */
  hydrated: boolean
  /** Escrituras en vuelo. Mientras haya alguna no se acepta una siembra externa. */
  pendingWrites: number
  hydrateCart: (items: CartItem[]) => void
  /** Relee el carrito del servidor (al abrir el drawer, al volver a la pestaña). */
  refreshCart: () => void
  /** Agrega respetando el stock. Devuelve cuántas unidades entraron (0 = tope). */
  addToCart: (product: CatalogProduct, qty?: number) => number
  /**
   * Agrega una unidad de cada producto en una sola operación. Devuelve los
   * nombres de los que no entraron (agotados o ya al tope) para que quien
   * llama muestre un único aviso en vez de uno por producto.
   */
  addManyToCart: (products: CatalogProduct[]) => { added: number; skipped: string[] }
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

type SetState = (
  partial: Partial<CartState> | ((s: CartState) => Partial<CartState>),
) => void

/**
 * Contador global de escrituras. Cada mutación se queda con su número y solo
 * aplica su respuesta si sigue siendo la última: las actions devuelven el
 * carrito completo y, con clicks rápidos, una respuesta vieja llegando tarde
 * hacía retroceder la cantidad en pantalla.
 */
let writeSeq = 0

/** Envuelve una escritura: marca la operación en vuelo y descarta respuestas viejas. */
function runWrite(set: SetState, op: () => Promise<CartLine[]>) {
  const seq = ++writeSeq
  set((s) => ({ pendingWrites: s.pendingWrites + 1 }))

  op()
    .then((cart) => {
      if (seq === writeSeq) set({ cart, cartCount: countCart(cart) })
    })
    .catch(() => {
      if (seq !== writeSeq) return
      // Re-sincroniza con el carrito real del servidor tras un fallo de red/DB.
      toast.error('No se pudo actualizar el carrito')
      getCartAction()
        .then((cart) => {
          if (seq === writeSeq) set({ cart, cartCount: countCart(cart) })
        })
        .catch(() => {})
    })
    .finally(() => {
      set((s) => ({ pendingWrites: Math.max(0, s.pendingWrites - 1) }))
    })
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
  hydrated: false,
  pendingWrites: 0,

  hydrateCart: (items) => {
    // Una siembra del servidor que llega mientras hay una escritura en vuelo
    // trae un carrito anterior a esa escritura y pisaría el estado optimista
    // (pasa con cualquier router.refresh()/revalidatePath del storefront, que
    // re-renderiza el layout y vuelve a montar el payload de getCart()).
    if (get().pendingWrites > 0) {
      set({ hydrated: true })
      return
    }
    set({ cart: items, cartCount: countCart(items), hydrated: true })
  },

  refreshCart: () => {
    if (get().pendingWrites > 0) return
    getCartAction()
      .then((cart) => {
        if (get().pendingWrites > 0) return
        set({ cart, cartCount: countCart(cart), hydrated: true })
      })
      .catch(() => {})
  },

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
    runWrite(set, () => addCartItemAction(product.id, toAdd))

    return toAdd
  },

  addManyToCart: (products) => {
    const current = get().cart
    const skipped: string[] = []
    const toAdd: CatalogProduct[] = []

    for (const product of products) {
      const inCart = current.find((i) => i.product.id === product.id)?.qty ?? 0
      const remaining = remainingStock(product, inCart)
      // Se descarta antes de llamar a addToCart para no disparar un aviso de
      // tope por cada producto: aquí se resume todo en uno solo.
      if (remaining !== null && remaining <= 0) skipped.push(product.name)
      else toAdd.push(product)
    }

    if (toAdd.length === 0) return { added: 0, skipped }

    set((s) => {
      const cart = [...s.cart]
      for (const product of toAdd) {
        const i = cart.findIndex((line) => line.product.id === product.id)
        if (i >= 0) cart[i] = { ...cart[i], qty: cart[i].qty + 1 }
        else cart.push({ product, qty: 1 })
      }
      return { cart, cartCount: countCart(cart) }
    })

    runWrite(set, () => addCartItemsAction(toAdd.map((p) => ({ productId: p.id, qty: 1 }))))

    return { added: toAdd.length, skipped }
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
    // Cantidad absoluta, no delta: ver setCartItemQtyAction.
    runWrite(set, () => setCartItemQtyAction(id, next))

    return true
  },

  removeItem: (id) => {
    set((s) => {
      const cart = s.cart.filter((i) => i.product.id !== id)
      return { cart, cartCount: countCart(cart) }
    })
    runWrite(set, () => removeCartItemAction(id))
  },

  clearCart: () => {
    set({ cart: [], cartCount: 0 })
    // Si el vaciado falla el carrito reaparece en la próxima lectura del
    // servidor, así que se avisa en vez de tragarse el error en silencio.
    clearCartAction().catch(() => {
      toast.error('No se pudo vaciar el carrito. Recargá la página para ver su estado real.')
    })
  },

  setCartOpen: (open) => set({ cartOpen: open }),
}))
