import 'server-only'
import { auth } from '@/auth'
import { isCartExpired } from '@/features/cart/lib/cart-ttl'
import { maxPurchasable } from '@/features/products/lib/stock'
import { getCartSessionId, getOrCreateCartSessionId } from '@/shared/lib/cart-session'
import { db } from '@/shared/lib/db'

/**
 * Fusiona el carrito anónimo (cookie) del navegador hacia el carrito de la
 * cuenta y descarta el anónimo. Invariante: un Cart nunca tiene userId y
 * sessionId a la vez (ver schema.prisma) — así un dispositivo compartido no
 * hereda el carrito de otra cuenta tras logout.
 */
export async function mergeAnonymousCartIntoUser(email: string): Promise<void> {
  const dbUser = await db.user.findUnique({ where: { email }, select: { id: true } })
  if (!dbUser) return

  const sessionId = await getCartSessionId()
  if (!sessionId) return

  const anonCart = await db.cart.findUnique({ where: { sessionId }, include: { items: true } })
  if (!anonCart) return

  // Un carrito anónimo caducado no aporta nada: se descarta sin fusionar.
  if (isCartExpired(anonCart)) {
    await db.cart.delete({ where: { id: anonCart.id } })
    return
  }

  const userCart = await db.cart.upsert({
    where: { userId: dbUser.id },
    update: {},
    create: { userId: dbUser.id },
  })

  if (anonCart.id === userCart.id) return

  // Tope de stock por producto. Sin esto la fusión sumaba a ciegas (era la
  // única ruta de escritura que no clampeaba): un invitado con 3 unidades y una
  // cuenta con 3 de un producto con stock 4 terminaba con una línea de 6, que
  // luego llegaba intacta a placeOrder → reserveStockForOrder.
  const products = await db.product.findMany({
    where: { id: { in: anonCart.items.map((i) => i.productId) } },
    select: { id: true, status: true, deletedAt: true, inventory: { select: { availableStock: true } } },
  })
  const caps = new Map<string, number | null>(
    products.map((p) => [
      p.id,
      p.deletedAt
        ? 0
        : maxPurchasable({ status: p.status, stock: p.inventory?.availableStock ?? 0 }),
    ]),
  )

  await db.$transaction(async (tx) => {
    for (const item of anonCart.items) {
      const max = caps.get(item.productId) ?? 0
      const existing = await tx.cartItem.findUnique({
        where: { cartId_productId: { cartId: userCart.id, productId: item.productId } },
      })
      const target = (existing?.quantity ?? 0) + item.quantity
      const quantity = max === null ? target : Math.min(target, max)

      if (quantity <= 0) {
        // Agotado o borrado mientras estaba en el carrito anónimo: no se arrastra.
        if (existing) await tx.cartItem.delete({ where: { id: existing.id } })
        continue
      }

      await tx.cartItem.upsert({
        where: { cartId_productId: { cartId: userCart.id, productId: item.productId } },
        update: { quantity },
        create: { cartId: userCart.id, productId: item.productId, quantity },
      })
    }
    await tx.cart.delete({ where: { id: anonCart.id } })
  })
}

/**
 * Marca actividad en el carrito (renueva su TTL) y, si ya estaba caducado,
 * lo vacía antes de reutilizarlo para que no reaparezcan ítems viejos.
 */
async function touchCart(cart: { id: string; userId: string | null; updatedAt: Date }) {
  if (isCartExpired(cart)) {
    await db.cartItem.deleteMany({ where: { cartId: cart.id } })
  }
  await db.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } })
  return cart.id
}

/** Resuelve (y crea si falta) el id del Cart vigente: por cuenta si hay sesión, por cookie si no. */
export async function getOrCreateCartId(): Promise<string> {
  const session = await auth()
  const email = session?.user?.email

  if (!email) {
    const sessionId = await getOrCreateCartSessionId()
    const cart = await db.cart.findUnique({ where: { sessionId } })
    if (cart) return touchCart(cart)
    return (await db.cart.create({ data: { sessionId } })).id
  }

  await mergeAnonymousCartIntoUser(email)

  const dbUser = await db.user.findUnique({ where: { email }, select: { id: true } })
  if (!dbUser) throw new Error('Usuario no encontrado')

  const userCart = await db.cart.findUnique({ where: { userId: dbUser.id } })
  if (userCart) return touchCart(userCart)
  return (await db.cart.create({ data: { userId: dbUser.id } })).id
}
