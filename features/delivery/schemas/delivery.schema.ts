import { z } from 'zod'

// ---------------------------------------------------------------------------
// Forma de entrega + sus sedes. El drawer del admin envía las sedes completas
// en cada guardado: la action las reemplaza en bloque (es una lista corta).
// ---------------------------------------------------------------------------

export const deliveryLocationSchema = z.object({
  label: z.string().min(1, 'Etiqueta requerida (ej: LIMA)').max(40),
  address: z.string().min(5, 'Dirección requerida').max(180),
  mapUrl: z
    .string()
    .max(500)
    .refine((v) => !v || /^https?:\/\//i.test(v), 'Debe ser un enlace http(s)')
    .optional()
    .default(''),
})

export const deliveryMethodSchema = z
  .object({
    name: z.string().min(1, 'Nombre requerido').max(60),
    description: z.string().max(400).optional().default(''),
    kind: z.enum(['PICKUP', 'PREORDER', 'SHIPPING'], { error: 'Tipo de entrega inválido' }),
    // Un campo numérico vacío llega como '' (o NaN con valueAsNumber): en
    // ambos casos significa "gratis", no "dato inválido".
    cost: z.preprocess((v) => {
      if (v === '' || v === null || v === undefined) return 0
      const n = Number(v)
      return Number.isNaN(n) ? 0 : n
    }, z.number().min(0, 'El costo no puede ser negativo')),
    requiresAddress: z.boolean().default(true),
    requiresLocation: z.boolean().default(false),
    active: z.boolean().default(true),
    locations: z.array(deliveryLocationSchema).max(20).optional().default([]),
  })
  .superRefine((data, ctx) => {
    // Un método que obliga a elegir sede sin sedes cargadas bloquearía el
    // checkout: no habría ninguna opción que seleccionar.
    if (data.requiresLocation && data.locations.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Agrega al menos una sede o desactiva "El cliente elige la sede"',
        path: ['locations'],
      })
    }
  })

export type DeliveryMethodInput = z.infer<typeof deliveryMethodSchema>
export type DeliveryMethodFormValues = z.input<typeof deliveryMethodSchema>
