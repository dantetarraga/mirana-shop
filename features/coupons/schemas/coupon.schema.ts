import { z } from 'zod'

export const couponDbSchema = z.object({
  code: z
    .string()
    .min(3, 'El código debe tener al menos 3 caracteres')
    .max(30, 'Máximo 30 caracteres')
    .regex(/^[A-Za-z0-9._-]+$/, 'Solo letras, números, punto, guion y guion bajo'),
  promotionId: z.string().min(1, 'Elige la promoción que desbloquea el cupón'),
  active: z.boolean().default(true),
  maxUses: z.preprocess(
    (v) => (v === '' || v === null || v === undefined || Number.isNaN(v) ? undefined : Number(v)),
    z.number().int().positive('Debe ser mayor a 0').optional(),
  ),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
})

export type CouponDbInput = z.infer<typeof couponDbSchema>
export type CouponFormValues = z.input<typeof couponDbSchema>
