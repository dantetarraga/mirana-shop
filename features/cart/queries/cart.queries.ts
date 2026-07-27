import 'server-only'
import { auth } from '@/auth'
import { isCartExpired } from '@/features/cart/lib/cart-ttl'
import { toProductCard } from '@/features/products/lib/product-card'
import { PRODUCT_LIST_SELECT } from '@/features/products/queries/product.queries'
import type { ProductListItem } from '@/features/products/types'
import { getCartSessionId } from '@/shared/lib/cart-session'
import { db } from '@/shared/lib/db'
import type { CartLine } from '@/features/cart/types'

const CART_INCLUDE = {
  items: { include: { product: { select: PRODUCT_LIST_SELECT } } },
} as const

async function findCartWithItems() {
  const session = await auth()
  const email = session?.user?.email

  if (email) {
    // Mismo criterio que `getOrCreateCartId`: si el JWT apunta a una cuenta que
    // ya no existe o está dada de baja, se lee el carrito anónimo. Sin esta
    // simetría se escribiría en el carrito de invitado y se leería el de la
    // cuenta (vacío), y los productos agregados no aparecerían por ningún lado.
    const cart = await db.cart.findFirst({
      where: { user: { email, deletedAt: null } },
      include: CART_INCLUDE,
    })
    if (cart) return cart

    const stillExists = await db.user.findFirst({
      where: { email, deletedAt: null },
      select: { id: true },
    })
    if (stillExists) return null
  }

  const sessionId = await getCartSessionId()
  if (!sessionId) return null

  return db.cart.findUnique({ where: { sessionId }, include: CART_INCLUDE })
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
