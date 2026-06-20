'use server'

import { getOrdersByEmail } from '@/features/orders/queries/order.queries'

export async function getMyOrders(email: string) {
  if (!email) return []
  return getOrdersByEmail(email)
}
