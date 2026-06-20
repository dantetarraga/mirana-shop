import { z } from 'zod'

export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum([
    'PENDING',
    'AWAITING_PROOF',
    'PAID',
    'PREPARING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
  ]),
})

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
