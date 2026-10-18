import 'server-only'
import { getOrdersByUserId } from '@/features/orders/queries/order.queries'
import { requireUser } from '@/shared/lib/require-user'

// Lectura de "Mis pedidos". Vivía en actions/ con 'use server', lo que la
// exponía como endpoint POST sin necesidad: es una lectura que solo llaman
// Server Components.
//
// SEGURIDAD: el email se deriva de la sesión, no se recibe del cliente.
// Sin este guard, cualquiera podría listar los pedidos de cualquier correo.
export async function getMyOrders() {
  const session = await requireUser()
  if (session.denied) return []
  return getOrdersByUserId(session.id)
}
