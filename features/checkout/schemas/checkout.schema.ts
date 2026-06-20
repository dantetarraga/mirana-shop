import { z } from 'zod'

export const checkoutSchema = z.object({
  fullName: z.string().min(2, 'Nombre y apellido requeridos'),
  email: z.string().email('Correo electrónico inválido'),
  phone: z.string().min(7, 'Teléfono requerido'),
  address: z.string().min(5, 'Dirección requerida'),
  district: z.string().min(2, 'Distrito requerido'),
  city: z.string().min(2, 'Ciudad requerida'),
  reference: z.string().optional(),
  paymentMethod: z.enum(['WHATSAPP_TRANSFER'], {
    error: 'Selecciona un método de pago',
  }),
})

export type CheckoutInput = z.infer<typeof checkoutSchema>
