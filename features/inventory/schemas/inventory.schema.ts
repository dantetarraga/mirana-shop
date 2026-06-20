import { z } from 'zod'

export const adjustStockSchema = z.object({
  productId: z.string().min(1),
  newStock: z.number().int().min(0, 'No puede ser negativo'),
  reason: z.string().optional(),
})

export type AdjustStockInput = z.infer<typeof adjustStockSchema>
