'use server'

import { auth } from '@/auth'
import { getCart } from '@/features/cart/queries/cart.queries'
import { getOrCreateCartId, mergeAnonymousCartIntoUser } from '@/features/cart/lib/cart-resolve'
import type { CartLine } from '@/features/cart/types'
import { db } from '@/shared/lib/db'

export async function getCartAction(): Promise<CartLine[]> {
  return getCart()
}

export async function addCartItemAction(productId: string, qty: number): Promise<CartLine[]> {
  const cartId = await getOrCreateCartId()
  await db.cartItem.upsert({
    where: { cartId_productId: { cartId, productId } },
    update: { quantity: { increment: qty } },
    create: { cartId, productId, quantity: qty },
  })
  return getCart()
}

export async function updateCartItemQtyAction(
  productId: string,
  delta: number,
): Promise<CartLine[]> {
  const cartId = await getOrCreateCartId()
  const existing = await db.cartItem.findUnique({
    where: { cartId_productId: { cartId, productId } },
  })
  if (existing) {
    await db.cartItem.update({
      where: { id: existing.id },
      data: { quantity: Math.max(1, existing.quantity + delta) },
    })
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
