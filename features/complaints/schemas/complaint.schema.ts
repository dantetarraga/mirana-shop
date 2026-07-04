import { z } from 'zod'

export const createComplaintSchema = z.object({
  fullName: z.string().trim().min(3, 'Ingresa tu nombre completo'),
  docType: z.enum(['DNI', 'CE', 'PASAPORTE']),
  docNumber: z.string().trim().min(6, 'Documento inválido'),
  address: z.string().trim().min(5, 'Ingresa tu domicilio'),
  phone: z.string().trim().min(6, 'Teléfono inválido'),
  email: z.string().trim().email('Correo inválido'),
  productDescription: z.string().trim().min(5, 'Describe el producto o servicio'),
  claimedAmount: z
    .string()
    .optional()
    .refine((v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0), 'Monto inválido'),
  type: z.enum(['RECLAMO', 'QUEJA']),
  detail: z.string().trim().min(10, 'Describe el detalle de tu reclamo'),
  request: z.string().trim().min(5, 'Indica qué pides como solución'),
})

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>

export const respondComplaintSchema = z.object({
  complaintId: z.string().min(1),
  response: z.string().trim().min(3, 'Escribe una respuesta'),
})

export type RespondComplaintInput = z.infer<typeof respondComplaintSchema>
