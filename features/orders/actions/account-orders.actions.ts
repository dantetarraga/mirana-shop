'use server'

import { getOrdersByEmail } from '@/features/orders/queries/order.queries'
import { requireUser } from '@/shared/lib/require-user'

// SEGURIDAD: el email se deriva de la sesión, no se recibe del cliente.
// Sin este guard, cualquiera podría listar los pedidos de cualquier correo.
export async function getMyOrders() {
  const session = await requireUser()
  if (session.denied) return []
  return getOrdersByEmail(session.email)
}
