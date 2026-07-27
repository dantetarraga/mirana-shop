'use server'

import { auth } from '@/auth'
import { getCart } from '@/features/cart/queries/cart.queries'
import { getOrCreateCartId, mergeAnonymousCartIntoUser } from '@/features/cart/lib/cart-resolve'
import type { CartLine } from '@/features/cart/types'
import { canPartialPreorder, type PreorderMode } from '@/features/checkout/lib/preorder'
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

/**
 * Modo con el que realmente se guarda la línea. El cliente puede pedir
 * 'PARTIAL' para un producto que no lo admite (payload manipulado, o el admin
 * apagó la preventa parcial mientras el producto estaba en el carrito): en ese
 * caso se guarda 'FULL' y se cobra el 100%.
 */
async function resolveMode(productId: string, requested: PreorderMode): Promise<PreorderMode> {
  if (requested !== 'PARTIAL') return 'FULL'

  const product = await db.product.findUnique({
    where: { id: productId },
    select: { status: true, allowPartialPreorder: true },
  })
  return product && canPartialPreorder(product) ? 'PARTIAL' : 'FULL'
}

export async function getCartAction(): Promise<CartLine[]> {
  return getCart()
}

export async function addCartItemAction(
  productId: string,
  qty: number,
  preorderMode: PreorderMode = 'FULL',
): Promise<CartLine[]> {
  const cartId = await getOrCreateCartId()
  const [existing, max, mode] = await Promise.all([
    db.cartItem.findUnique({ where: { cartId_productId: { cartId, productId } } }),
    maxQtyFor(productId),
    resolveMode(productId, preorderMode),
  ])

  const target = (existing?.quantity ?? 0) + Math.max(0, qty)
  // Cantidad absoluta en vez de `increment`: con el tope aplicado, sumar a
  // ciegas podría dejar la línea por encima del stock.
  const quantity = max === null ? target : Math.min(target, max)
  if (quantity <= 0) return getCart()

  // La clave única es (cartId, productId): un producto tiene un solo modo por
  // carrito, así que agregarlo con otro modo reemplaza el anterior en vez de
  // abrir una segunda línea.
  await db.cartItem.upsert({
    where: { cartId_productId: { cartId, productId } },
    update: { quantity, preorderMode: mode },
    create: { cartId, productId, quantity, preorderMode: mode },
  })
  return getCart()
}

/** Cambia solo la forma de pago de una línea ya existente. */
export async function setCartItemModeAction(
  productId: string,
  preorderMode: PreorderMode,
): Promise<CartLine[]> {
  const cartId = await getOrCreateCartId()
  const mode = await resolveMode(productId, preorderMode)

  await db.cartItem.updateMany({ where: { cartId, productId }, data: { preorderMode: mode } })
  return getCart()
}

/**
 * Agrega varios productos de una sola vez (botón "Agregar todo" de una
 * colección). Se hace en una sola action en lugar de N llamadas sueltas: cada
 * una devuelve el carrito completo y, lanzadas en paralelo, la última en
 * responder podía pisar la caché del cliente con una lectura anterior.
 */
export async function addCartItemsAction(
  items: { productId: string; qty: number }[],
): Promise<CartLine[]> {
  if (items.length === 0) return getCart()

  const cartId = await getOrCreateCartId()

  for (const { productId, qty } of items) {
    const [existing, max] = await Promise.all([
      db.cartItem.findUnique({ where: { cartId_productId: { cartId, productId } } }),
      maxQtyFor(productId),
    ])

    const target = (existing?.quantity ?? 0) + Math.max(0, qty)
    const quantity = max === null ? target : Math.min(target, max)
    if (quantity <= 0) continue

    await db.cartItem.upsert({
      where: { cartId_productId: { cartId, productId } },
      update: { quantity },
      create: { cartId, productId, quantity },
    })
  }

  return getCart()
}

/**
 * Fija la cantidad de una línea a un valor ABSOLUTO.
 *
 * Antes recibía un delta y hacía `existing.quantity + delta`. Como cada action
 * devuelve el carrito entero y no hay orden garantizado de respuestas, pulsar
 * +/− rápido aplicaba los deltas sobre estados distintos y la cantidad
 * retrocedía sola. Con cantidad absoluta la última respuesta que llega es
 * coherente con el último click, sin importar el orden.
 */
export async function setCartItemQtyAction(
  productId: string,
  quantity: number,
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
      const target = Math.max(1, Math.floor(quantity))
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
