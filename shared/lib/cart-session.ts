import 'server-only'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'

const CART_COOKIE = 'cart_sid'
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 180 // 180 días

/** Lee el id de sesión anónima del carrito sin crearlo. Para Server Components. */
export async function getCartSessionId(): Promise<string | null> {
  const store = await cookies()
  return store.get(CART_COOKIE)?.value ?? null
}

/** Lee o crea el id de sesión anónima del carrito. Solo desde Server Actions/Route Handlers. */
export async function getOrCreateCartSessionId(): Promise<string> {
  const store = await cookies()
  const existing = store.get(CART_COOKIE)?.value
  if (existing) return existing

  const id = randomUUID()
  store.set(CART_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: CART_COOKIE_MAX_AGE,
    path: '/',
  })
  return id
}
