'use server'

import { auth } from '@/auth'
import { getCart } from '@/features/cart/queries/cart.queries'
import { getOrCreateCartId, mergeAnonymousCartIntoUser } from '@/features/cart/lib/cart-resolve'
import type { CartLine } from '@/features/cart/types'
import { maxPurchasable } from '@/features/products/lib/stock'
import { db } from '@/shared/lib/db'

/**
 * Tope de unidades del producto. `null` = sin tope (preventa).
 * El cliente ya limita en la UI, pero estas actions son un endpoint público:
 * el stock real se vuelve a comprobar aquí antes de tocar la BD.
 */
async function maxQtyFor(productId: string): Promise<number | null> {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { status: true, deletedAt: true, inventory: { select: { availableStock: true } } },
  })
  if (!product || product.deletedAt) return 0

  return maxPurchasable({
    status: product.status,
    stock: product.inventory?.availableStock ?? 0,
  })
}

export async function getCartAction(): Promise<CartLine[]> {
  return getCart()
}

export async function addCartItemAction(productId: string, qty: number): Promise<CartLine[]> {
  const cartId = await getOrCreateCartId()
  const [existing, max] = await Promise.all([
    db.cartItem.findUnique({ where: { cartId_productId: { cartId, productId } } }),
    maxQtyFor(productId),
  ])

  const target = (existing?.quantity ?? 0) + Math.max(0, qty)
  // Cantidad absoluta en vez de `increment`: con el tope aplicado, sumar a
  // ciegas podría dejar la línea por encima del stock.
  const quantity = max === null ? target : Math.min(target, max)
  if (quantity <= 0) return getCart()

  await db.cartItem.upsert({
    where: { cartId_productId: { cartId, productId } },
    update: { quantity },
    create: { cartId, productId, quantity },
  })
  return getCart()
}

export async function updateCartItemQtyAction(
  productId: string,
  delta: number,
): Promise<CartLine[]> {
  const cartId = await getOrCreateCartId()
  const [existing, max] = await Promise.all([
    db.cartItem.findUnique({ where: { cartId_productId: { cartId, productId } } }),
    maxQtyFor(productId),
  ])

  if (existing) {
    if (max === 0) {
      // Se agotó mientras el producto estaba en el carrito: la línea ya no vale.
      await db.cartItem.delete({ where: { id: existing.id } })
    } else {
      const target = Math.max(1, existing.quantity + delta)
      await db.cartItem.update({
        where: { id: existing.id },
        data: { quantity: max === null ? target : Math.min(target, max) },
      })
    }
  }
  return getCart()
}

export async function removeCartItemAction(productId: string): Promise<CartLine[]> {
  const cartId = await getOrCreateCartId()
  await db.cartItem.deleteMany({ where: { cartId, productId } })
  return getCart()
}

export async function clearCartAction(): Promise<CartLine[]> {
  const cartId = await getOrCreateCartId()
  await db.cartItem.deleteMany({ where: { cartId } })
  return []
}

/** Fusiona el carrito anónimo a la cuenta tras un login client-side (sin recarga de página). */
export async function mergeCartOnLoginAction(): Promise<CartLine[]> {
  const session = await auth()
  if (session?.user?.email) await mergeAnonymousCartIntoUser(session.user.email)
  return getCart()
}
