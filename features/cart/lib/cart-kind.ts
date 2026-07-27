// ---------------------------------------------------------------------------
// Tipo de carrito — la preventa no se mezcla con el resto del catálogo.
//
// Un pedido de preventa se coordina cuando llega la mercadería, así que no
// puede viajar en el mismo pedido que un producto que sale hoy: cambiarían la
// fecha de entrega, la forma de envío y el saldo pendiente de una sola orden.
// La regla es única para cliente y servidor, igual que `stock.ts`:
//   - el carrito la aplica al agregar (abre el modal de conflicto),
//   - el checkout la usa para filtrar las formas de entrega,
//   - placeOrder la vuelve a comprobar antes de crear la orden.
//
// Archivo puro (sin 'server-only'): viaja al cliente.
// ---------------------------------------------------------------------------

import type { ProductStatus } from '@/generated/prisma/client'

/** Los dos mundos que no pueden convivir en un mismo carrito. */
export type CartKind = 'PREORDER' | 'STANDARD'

/** Texto corto para hablarle al cliente de "su" carrito. */
export const CART_KIND_LABEL: Record<CartKind, string> = {
  PREORDER: 'preventa',
  STANDARD: 'entrega inmediata',
}

/** Nombre en plural para listar productos de un tipo. */
export const CART_KIND_PRODUCTS_LABEL: Record<CartKind, string> = {
  PREORDER: 'productos en preventa',
  STANDARD: 'productos de entrega inmediata',
}

type WithStatus = { status: ProductStatus }

/**
 * A qué mundo pertenece un producto. Todo lo que no es PREORDER (disponible,
 * agotado, próximamente) cuenta como entrega inmediata: son productos que la
 * tienda ya tiene o va a tener sin coordinación previa.
 */
export function productCartKind(product: WithStatus): CartKind {
  return product.status === 'PREORDER' ? 'PREORDER' : 'STANDARD'
}

/** Tipo del carrito según lo que ya tiene dentro. `null` = carrito vacío. */
export function cartKindOf(products: WithStatus[]): CartKind | null {
  const first = products[0]
  return first ? productCartKind(first) : null
}

/** ¿La lista mezcla los dos mundos? Solo debería pasar con un payload manipulado. */
export function hasMixedKinds(products: WithStatus[]): boolean {
  if (products.length < 2) return false
  const kind = productCartKind(products[0])
  return products.some((p) => productCartKind(p) !== kind)
}

/** ¿Agregar este producto rompería la regla con el carrito actual? */
export function conflictsWithCart(current: WithStatus[], incoming: WithStatus): boolean {
  const kind = cartKindOf(current)
  return kind !== null && kind !== productCartKind(incoming)
}

/**
 * Reparte una lista de productos entre los que caben en el carrito y los que
 * chocan. Con el carrito vacío (`current === null`) manda el tipo del primer
 * producto de la lista, así "agregar toda la colección" entra con el criterio
 * de lo primero que se pudo llevar.
 */
export function splitByCartKind<T extends WithStatus>(
  products: T[],
  current: CartKind | null,
): { kind: CartKind | null; compatible: T[]; blocked: T[] } {
  let kind = current
  const compatible: T[] = []
  const blocked: T[] = []

  for (const product of products) {
    const productKind = productCartKind(product)
    if (kind === null) kind = productKind
    if (productKind === kind) compatible.push(product)
    else blocked.push(product)
  }

  return { kind, compatible, blocked }
}
