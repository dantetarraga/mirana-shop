'use server'

import { orderRepo } from '@/features/orders/services/order.service'

export async function getMyOrders(email: string) {
  if (!email) return []
  return orderRepo.findByEmail(email)
}
