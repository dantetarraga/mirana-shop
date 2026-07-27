import 'server-only'
import { auth } from '@/auth'
import { isCartExpired } from '@/features/cart/lib/cart-ttl'
import { toProductCard } from '@/features/products/lib/product-card'
import { PRODUCT_LIST_SELECT } from '@/features/products/queries/product.queries'
import type { ProductListItem } from '@/features/products/types'
import { getCartSessionId } from '@/shared/lib/cart-session'
import { db } from '@/shared/lib/db'
import type { CartLine } from '@/features/cart/types'

async function findCartWithItems() {
  const session = await auth()
  const email = session?.user?.email

  if (email) {
    return db.cart.findFirst({
      where: { user: { email } },
      include: { items: { include: { product: { select: PRODUCT_LIST_SELECT } } } },
    })
  }

  const sessionId = await getCartSessionId()
  if (!sessionId) return null

  return db.cart.findUnique({
    where: { sessionId },
    include: { items: { include: { product: { select: PRODUCT_LIST_SELECT } } } },
  })
}

/**
 * Carrito + si se vació por caducidad, para poder avisarlo en la UI: antes los
 * ítems simplemente desaparecían sin explicación.
 */
export async function getCartState(): Promise<{ items: CartLine[]; expired: boolean }> {
  const cart = await findCartWithItems()
  if (!cart) return { items: [], expired: false }

  // Caducado: se muestra vacío. El vaciado real ocurre al volver a escribir
  // (`getOrCreateCartId`) o en el cron de limpieza — la lectura no muta la DB.
  if (isCartExpired(cart)) return { items: [], expired: cart.items.length > 0 }

  return {
    items: cart.items.map((item) => ({
      product: toProductCard(item.product as ProductListItem),
      qty: item.quantity,
      preorderMode: item.preorderMode,
    })),
    expired: false,
  }
}

/** Carrito persistido en servidor — por cuenta si hay sesión, por cookie anónima si no. */
export async function getCart(): Promise<CartLine[]> {
  return (await getCartState()).items
}
