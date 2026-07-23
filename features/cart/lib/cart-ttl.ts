import 'server-only'
import { db } from '@/shared/lib/db'

// ---------------------------------------------------------------------------
// Caducidad del carrito — ventana deslizante desde la última actividad
// (`Cart.updatedAt`, que se refresca en cada mutación vía `getOrCreateCartId`).
//
// Anónimo: más corto, es solo una cookie en un navegador que puede ser público.
// De cuenta: más largo, el usuario espera reencontrar lo que dejó pendiente.
// ---------------------------------------------------------------------------

export const ANON_CART_TTL_DAYS = 30
export const USER_CART_TTL_DAYS = 90

const DAY_MS = 24 * 60 * 60 * 1000

type CartLifetime = { userId: string | null; updatedAt: Date }

export function cartTtlDays(cart: Pick<CartLifetime, 'userId'>): number {
  return cart.userId ? USER_CART_TTL_DAYS : ANON_CART_TTL_DAYS
}

/** ¿El carrito lleva inactivo más que su TTL? */
export function isCartExpired(cart: CartLifetime, now: Date = new Date()): boolean {
  return now.getTime() - cart.updatedAt.getTime() > cartTtlDays(cart) * DAY_MS
}

/**
 * Borra los carritos caducados. Pensado para el cron (`/api/cron/carts`); el
 * camino de lectura/escritura ya ignora y vacía los caducados por su cuenta,
 * esto es solo la limpieza de filas muertas en la DB.
 */
export async function purgeExpiredCarts() {
  const now = Date.now()

  const anon = await db.cart.deleteMany({
    where: { userId: null, updatedAt: { lt: new Date(now - ANON_CART_TTL_DAYS * DAY_MS) } },
  })
  const user = await db.cart.deleteMany({
    where: { userId: { not: null }, updatedAt: { lt: new Date(now - USER_CART_TTL_DAYS * DAY_MS) } },
  })

  return { anonymous: anon.count, users: user.count }
}
