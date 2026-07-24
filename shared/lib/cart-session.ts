import 'server-only'
import { CART_TTL_DAYS } from '@/features/cart/lib/cart-ttl'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'

const CART_COOKIE = 'cart_sid'
// Igual que el TTL del carrito en DB: cookie y fila caducan a la vez.
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * CART_TTL_DAYS

/** Lee el id de sesión anónima del carrito sin crearlo. Para Server Components. */
export async function getCartSessionId(): Promise<string | null> {
  const store = await cookies()
  return store.get(CART_COOKIE)?.value ?? null
}

/**
 * Lee o crea el id de sesión anónima del carrito, renovando su caducidad en
 * cada llamada (ventana deslizante: mientras el visitante siga usando el
 * carrito, la cookie no expira). Solo desde Server Actions/Route Handlers.
 */
export async function getOrCreateCartSessionId(): Promise<string> {
  const store = await cookies()
  const id = store.get(CART_COOKIE)?.value ?? randomUUID()

  store.set(CART_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: CART_COOKIE_MAX_AGE,
    path: '/',
  })
  return id
}
