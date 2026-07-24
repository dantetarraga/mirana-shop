import 'server-only'
import { db } from '@/shared/lib/db'

// ---------------------------------------------------------------------------
// Caducidad del carrito — ventana deslizante desde la última actividad
// (`Cart.updatedAt`, que se refresca en cada mutación vía `getOrCreateCartId`).
//
// Un día, tanto para el carrito anónimo como para el de cuenta: pasado ese
// tiempo sin tocarlo se considera abandonado y se vacía.
// ---------------------------------------------------------------------------

export const CART_TTL_DAYS = 1

const DAY_MS = 24 * 60 * 60 * 1000
const CART_TTL_MS = CART_TTL_DAYS * DAY_MS

/** ¿El carrito lleva inactivo más que el TTL? */
export function isCartExpired(cart: { updatedAt: Date }, now: Date = new Date()): boolean {
  return now.getTime() - cart.updatedAt.getTime() > CART_TTL_MS
}

/**
 * Borra los carritos caducados. Pensado para el cron (`/api/cron/carts`); el
 * camino de lectura/escritura ya ignora y vacía los caducados por su cuenta,
 * esto es solo la limpieza de filas muertas en la DB.
 */
export async function purgeExpiredCarts() {
  const cutoff = new Date(Date.now() - CART_TTL_MS)

  const anon = await db.cart.deleteMany({
    where: { userId: null, updatedAt: { lt: cutoff } },
  })
  const user = await db.cart.deleteMany({
    where: { userId: { not: null }, updatedAt: { lt: cutoff } },
  })

  return { anonymous: anon.count, users: user.count }
}
