import { z } from 'zod'

export const promotionDbSchema = z
  .object({
    name: z.string().min(1, 'Nombre requerido'),
    description: z.string().optional().default(''),
    type: z.enum(['FREE_SHIPPING', 'FIXED_DISCOUNT', 'PERCENT_DISCOUNT'], {
      error: 'Tipo de promoción inválido',
    }),
    active: z.boolean().default(true),
    minAmount: z.preprocess(
      (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
      z.number().positive('Debe ser mayor a 0').optional(),
    ),
    discountAmount: z.preprocess(
      (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
      z.number().positive('Debe ser mayor a 0').optional(),
    ),
    discountPercent: z.preprocess(
      (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
      z.number().min(1).max(100).optional(),
    ),
    startsAt: z.string().optional(),
    endsAt: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'FIXED_DISCOUNT' && !data.discountAmount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Se requiere el monto de descuento',
        path: ['discountAmount'],
      })
    }
    if (data.type === 'PERCENT_DISCOUNT' && !data.discountPercent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Se requiere el porcentaje de descuento',
        path: ['discountPercent'],
      })
    }
  })

export type PromotionDbInput = z.infer<typeof promotionDbSchema>
