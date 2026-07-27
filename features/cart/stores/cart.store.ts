import {
  addCartItemAction,
  addCartItemsAction,
  clearCartAction,
  getCartAction,
  removeCartItemAction,
  setCartItemModeAction,
  setCartItemQtyAction,
} from '@/features/cart/actions/cart.actions'
import {
  cartKindOf,
  conflictsWithCart,
  splitByCartKind,
  type CartKind,
} from '@/features/cart/lib/cart-kind'
import type { CartLine } from '@/features/cart/types'
import { canPartialPreorder, type PreorderMode } from '@/features/checkout/lib/preorder'
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

/**
 * Intento de agregar un producto que rompe la regla de tipos del carrito
 * (`features/cart/lib/cart-kind.ts`). Queda guardado mientras el cliente decide
 * qué hacer en el modal; ninguna de las tres salidas es un descarte silencioso.
 */
export interface CartMixConflict {
  product: CatalogProduct
  qty: number
  preorderMode: PreorderMode
  /** Tipo de lo que ya hay en el carrito — lo que produce el choque. */
  cartKind: CartKind
}

/** Qué hacer con el carrito actual cuando choca con lo que se quiso agregar. */
export type CartMixResolution =
  /** Vaciarlo y dejar dentro solo el producto nuevo. */
  | 'replace'
  /** Vaciarlo sin agregar nada. */
  | 'empty'

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
  /**
   * Choque de tipos esperando decisión del cliente. Lo pinta `CartMixModal`
   * (montado una sola vez en StoreOverlays), así que cualquier superficie que
   * llame a `addToCart` muestra el mismo modal sin cablearlo.
   */
  mixConflict: CartMixConflict | null
  hydrateCart: (items: CartItem[]) => void
  /** Relee el carrito del servidor (al abrir el drawer, al volver a la pestaña). */
  refreshCart: () => void
  /**
   * Agrega respetando el stock. Devuelve cuántas unidades entraron:
   * 0 = no entró nada (llegó al tope de stock, o chocó con el tipo del carrito
   * y quedó un `mixConflict` abierto). Quien llama solo confirma si entró algo.
   */
  addToCart: (product: CatalogProduct, qty?: number, preorderMode?: PreorderMode) => number
  /** Cierra el modal de conflicto dejando el carrito como está. */
  dismissMixConflict: () => void
  /** Resuelve el conflicto abierto. Ver `CartMixResolution`. */
  resolveMixConflict: (resolution: CartMixResolution) => void
  /** Cambia total ↔ parcial en una línea de preventa ya agregada. */
  setLineMode: (id: string, preorderMode: PreorderMode) => void
  /**
   * Agrega una unidad de cada producto en una sola operación. Devuelve los
   * nombres de los que no entraron para que quien llama muestre un único aviso
   * en vez de uno por producto: `skipped` = agotados o ya al tope, `blocked` =
   * no se pueden combinar con el tipo del carrito.
   */
  addManyToCart: (products: CatalogProduct[]) => {
    added: number
    skipped: string[]
    blocked: string[]
  }
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
  mixConflict: null,

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

  addToCart: (product, qty = 1, preorderMode = 'FULL') => {
    // Preventa y entrega inmediata no viajan en el mismo pedido. En vez de
    // rechazar con un aviso, se abre el modal: el cliente decide si paga lo que
    // ya tenía, lo reemplaza o lo vacía. Los botones de compra recién se
    // habilitan con el carrito hidratado (`ctaState`), así que acá `cart` ya es
    // el del servidor y no un vacío del primer pintado.
    const current = get().cart.map((i) => i.product)
    const currentKind = cartKindOf(current)
    if (currentKind !== null && conflictsWithCart(current, product)) {
      set({ mixConflict: { product, qty, preorderMode, cartKind: currentKind } })
      return 0
    }

    const inCart = get().cart.find((i) => i.product.id === product.id)?.qty ?? 0
    const remaining = remainingStock(product, inCart)
    const toAdd = remaining === null ? qty : Math.min(qty, remaining)

    if (toAdd <= 0) {
      toast.warning(stockLimitMessage(product.name))
      return 0
    }

    // El servidor vuelve a comprobarlo (resolveMode); esto solo evita mostrar
    // un adelanto optimista que la respuesta va a corregir un instante después.
    const mode: PreorderMode =
      preorderMode === 'PARTIAL' && canPartialPreorder(product) ? 'PARTIAL' : 'FULL'

    set((s) => {
      const ex = s.cart.find((i) => i.product.id === product.id)
      const cart = ex
        ? s.cart.map((i) =>
            i.product.id === product.id ? { ...i, qty: i.qty + toAdd, preorderMode: mode } : i,
          )
        : [...s.cart, { product, qty: toAdd, preorderMode: mode }]
      return { cart, cartCount: countCart(cart) }
    })
    runWrite(set, () => addCartItemAction(product.id, toAdd, mode))

    return toAdd
  },

  dismissMixConflict: () => set({ mixConflict: null }),

  resolveMixConflict: (resolution) => {
    const pending = get().mixConflict
    set({ mixConflict: null })
    if (!pending) return

    if (resolution === 'empty') {
      get().clearCart()
      return
    }

    // 'replace': el carrito queda con una sola línea, así que el tope es el
    // stock completo del producto y no lo que le faltaba por agregar.
    const { product, qty, preorderMode } = pending
    const max = maxPurchasable(product)
    const toAdd = max === null ? qty : Math.min(qty, max)

    if (toAdd <= 0) {
      // Se agotó entre que abrió el modal y que eligió: se vacía igual (es lo
      // que pidió) y se avisa por qué el producto no entró.
      toast.warning(stockLimitMessage(product.name))
      get().clearCart()
      return
    }

    const mode: PreorderMode =
      preorderMode === 'PARTIAL' && canPartialPreorder(product) ? 'PARTIAL' : 'FULL'

    set({ cart: [{ product, qty: toAdd, preorderMode: mode }], cartCount: toAdd })
    // Vaciar y agregar van encadenados dentro de la MISMA escritura: lanzados
    // por separado, el vaciado podía resolverse después del alta y dejar el
    // carrito sin el producto nuevo.
    runWrite(set, async () => {
      await clearCartAction()
      return addCartItemAction(product.id, toAdd, mode)
    })
  },

  setLineMode: (id, preorderMode) => {
    const item = get().cart.find((i) => i.product.id === id)
    if (!item || item.preorderMode === preorderMode) return

    const mode: PreorderMode =
      preorderMode === 'PARTIAL' && canPartialPreorder(item.product) ? 'PARTIAL' : 'FULL'

    set((s) => ({
      cart: s.cart.map((i) => (i.product.id === id ? { ...i, preorderMode: mode } : i)),
    }))
    runWrite(set, () => setCartItemModeAction(id, mode))
  },

  addManyToCart: (products) => {
    const current = get().cart
    const skipped: string[] = []
    const available: CatalogProduct[] = []

    for (const product of products) {
      const inCart = current.find((i) => i.product.id === product.id)?.qty ?? 0
      const remaining = remainingStock(product, inCart)
      // Se descarta antes de llamar a addToCart para no disparar un aviso de
      // tope por cada producto: aquí se resume todo en uno solo.
      if (remaining !== null && remaining <= 0) skipped.push(product.name)
      else available.push(product)
    }

    // Una colección puede mezclar preventa y stock. Acá no se abre el modal de
    // conflicto (sería una decisión por producto sobre una acción masiva): se
    // agrega lo compatible y se devuelven los nombres del resto para avisarlo.
    const { compatible: toAdd, blocked } = splitByCartKind(
      available,
      cartKindOf(current.map((i) => i.product)),
    )

    if (toAdd.length === 0) return { added: 0, skipped, blocked: blocked.map((p) => p.name) }

    set((s) => {
      const cart = [...s.cart]
      for (const product of toAdd) {
        const i = cart.findIndex((line) => line.product.id === product.id)
        if (i >= 0) cart[i] = { ...cart[i], qty: cart[i].qty + 1 }
        // "Agregar toda la colección" siempre va a precio completo: elegir
        // adelanto es una decisión por producto, en su ficha.
        else cart.push({ product, qty: 1, preorderMode: 'FULL' })
      }
      return { cart, cartCount: countCart(cart) }
    })

    runWrite(set, () => addCartItemsAction(toAdd.map((p) => ({ productId: p.id, qty: 1 }))))

    return { added: toAdd.length, skipped, blocked: blocked.map((p) => p.name) }
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
      toast.error('No se pudo vaciar el carrito. Recarga la página para ver su estado real.')
    })
  },

  setCartOpen: (open) => set({ cartOpen: open }),
}))
