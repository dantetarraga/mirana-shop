'use client'

import { useCartStore } from '@/features/cart/stores/cart.store'
import {
  balanceUnitPrice,
  canPartialPreorder,
  depositUnitPrice,
  resolveDepositPercent,
  type PreorderMode,
} from '@/features/checkout/lib/preorder'
import { effectivePrice } from '@/features/checkout/lib/pricing'
import { remainingStock } from '@/features/products/lib/stock'
import type { CatalogProduct } from '@/features/products/types/catalog.types'

export interface PreorderInfo {
  /** El producto admite pagar solo un adelanto. */
  canPartial: boolean
  /** % de adelanto vigente (del producto o el global). */
  depositPercent: number
  /** Adelanto por unidad. */
  depositUnit: number
  /** Saldo por unidad que queda para después. */
  balanceUnit: number
}

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
  /** Modo de pago de la línea en el carrito ('FULL' si no está agregado). */
  preorderMode: PreorderMode
  /** Datos del adelanto — `null` si el producto no admite preventa parcial. */
  preorder: PreorderInfo | null
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
export function useCartLine(
  product: CatalogProduct,
  /** % de adelanto global de la tienda; solo hace falta si el producto no tiene el suyo. */
  defaultDepositPercent?: number,
): CartLineState {
  const line = useCartStore((s) => s.cart.find((i) => i.product.id === product.id))
  const hydrated = useCartStore((s) => s.hydrated)

  // La línea del carrito trae el producto releído del servidor en cada mutación
  // (cart.queries.ts), así que su stock y su precio son más frescos que el prop,
  // que quedó fijado cuando se renderizó la página.
  const p = line?.product ?? product
  const qtyInCart = line?.qty ?? 0
  const isPreorder = p.status === 'PREORDER'

  const preorder: PreorderInfo | null = canPartialPreorder(p)
    ? {
        canPartial: true,
        depositPercent: resolveDepositPercent(p, defaultDepositPercent),
        depositUnit: depositUnitPrice(p, defaultDepositPercent),
        balanceUnit: balanceUnitPrice(p, defaultDepositPercent),
      }
    : null

  return {
    product: p,
    qtyInCart,
    isPreorder,
    isOutOfStock: p.status === 'SOLD_OUT' || (!isPreorder && p.stock === 0),
    remaining: remainingStock(p, qtyInCart),
    unitPrice: effectivePrice(p),
    hasDiscount: p.salePrice != null && p.salePrice < p.price,
    hydrated,
    preorderMode: line?.preorderMode ?? 'FULL',
    preorder,
  }
}
