'use client'

import { useCartStore } from '@/features/cart/stores/cart.store'
import { effectivePrice } from '@/features/checkout/lib/pricing'
import { remainingStock } from '@/features/products/lib/stock'
import type { CatalogProduct } from '@/features/products/types/catalog.types'

export interface CartLineState {
  /** El producto más fresco disponible (línea del carrito si existe, si no el prop). */
  product: CatalogProduct
  /** Unidades de este producto ya en el carrito. */
  qtyInCart: number
  isPreorder: boolean
  isOutOfStock: boolean
  /** Unidades que todavía se pueden agregar. `null` = sin tope (preventa). */
  remaining: number | null
  /** Precio unitario con la oferta ya aplicada. */
  unitPrice: number
  hasDiscount: boolean
  /** El store aún no recibió el carrito real del servidor. */
  hydrated: boolean
}

/**
 * Estado de un producto respecto del carrito — fuente única para card, modal,
 * PDP y drawer.
 *
 * Antes cada superficie lo derivaba por su cuenta y divergían: había tres
 * definiciones distintas de "sin stock" (el PDP era la única que no eximía la
 * preventa, así que daba por agotado un producto que la card sí dejaba
 * reservar) y el precio con oferta se recalculaba a mano en vez de usar
 * `effectivePrice`.
 */
export function useCartLine(product: CatalogProduct): CartLineState {
  const line = useCartStore((s) => s.cart.find((i) => i.product.id === product.id))
  const hydrated = useCartStore((s) => s.hydrated)

  // La línea del carrito trae el producto releído del servidor en cada mutación
  // (cart.queries.ts), así que su stock y su precio son más frescos que el prop,
  // que quedó fijado cuando se renderizó la página.
  const p = line?.product ?? product
  const qtyInCart = line?.qty ?? 0
  const isPreorder = p.status === 'PREORDER'

  return {
    product: p,
    qtyInCart,
    isPreorder,
    isOutOfStock: p.status === 'SOLD_OUT' || (!isPreorder && p.stock === 0),
    remaining: remainingStock(p, qtyInCart),
    unitPrice: effectivePrice(p),
    hasDiscount: p.salePrice != null && p.salePrice < p.price,
    hydrated,
  }
}
