'use server'

import { orderRepo } from '@/modules/orders/repositories/order.repo'

export async function getMyOrders(email: string) {
  if (!email) return []
  return orderRepo.findByEmail(email)
}
