// ---------------------------------------------------------------------------
// Qué formas de entrega puede elegir un carrito.
//
// Depende de su tipo (ver `features/cart/lib/cart-kind.ts`):
//   - preventa           → entrega de preventa + retiro en tienda
//   - entrega inmediata  → envío a domicilio + retiro en tienda
//
// El retiro en tienda vale para los dos: el cliente pasa a recogerlo, con
// mercadería en stock o cuando la preventa llegue.
//
// Archivo puro, igual que `pricing.ts`: el checkout lo usa para pintar el
// selector y placeOrder lo REUTILIZA para validar lo que llegó del navegador.
// ---------------------------------------------------------------------------

import type { CartKind } from '@/features/cart/lib/cart-kind'
import type { DeliveryKind, DeliveryMethodOption } from '@/features/delivery/types'

const KINDS_BY_CART: Record<CartKind, DeliveryKind[]> = {
  PREORDER: ['PREORDER', 'PICKUP'],
  STANDARD: ['SHIPPING', 'PICKUP'],
}

/** Tipos de entrega admitidos. Con el carrito vacío (`null`) no se filtra nada. */
export function allowedDeliveryKinds(cartKind: CartKind | null): DeliveryKind[] {
  return cartKind ? KINDS_BY_CART[cartKind] : ['PICKUP', 'PREORDER', 'SHIPPING']
}

export function isDeliveryMethodEligible(
  method: { kind: DeliveryKind },
  cartKind: CartKind | null,
): boolean {
  return allowedDeliveryKinds(cartKind).includes(method.kind)
}

/**
 * Formas de entrega que se le muestran a este carrito. Conserva el orden del
 * admin, así que la preseleccionada (`defaultDeliveryMethod`) sigue siendo la
 * primera activa entre las que quedan.
 */
export function eligibleDeliveryMethods(
  methods: DeliveryMethodOption[],
  cartKind: CartKind | null,
): DeliveryMethodOption[] {
  const allowed = allowedDeliveryKinds(cartKind)
  return methods.filter((m) => allowed.includes(m.kind))
}
