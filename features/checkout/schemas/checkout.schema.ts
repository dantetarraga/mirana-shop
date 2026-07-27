import { z } from 'zod'

// ---------------------------------------------------------------------------
// Checkout — el formulario cambia según la forma de entrega elegida: el retiro
// en tienda y la preventa no piden dirección, y solo algunos métodos obligan a
// elegir una sede. Por eso el esquema se construye con esas dos banderas.
//
// El cliente las saca del método seleccionado en pantalla; el servidor las
// vuelve a leer de la BD antes de validar, así que un payload manipulado no
// puede saltarse la dirección de un envío a domicilio.
// ---------------------------------------------------------------------------

export interface CheckoutFormRules {
  /**
   * La tienda tiene formas de entrega configuradas y hay que elegir una.
   * Con `false` (ninguna configurada) el checkout cae al envío base de siempre.
   */
  requiresMethod: boolean
  /** El método elegido pide dirección de entrega */
  requiresAddress: boolean
  /** El método elegido obliga a seleccionar una sede */
  requiresLocation: boolean
}

export function buildCheckoutSchema({
  requiresMethod,
  requiresAddress,
  requiresLocation,
}: CheckoutFormRules) {
  return z
    .object({
      fullName: z.string().min(2, 'Nombre y apellido requeridos'),
      email: z.string().email('Correo electrónico inválido'),
      phone: z.string().min(7, 'Teléfono requerido'),
      dni: z
        .string()
        .trim()
        .regex(/^\d{8}$/, 'El DNI debe tener 8 dígitos'),

      deliveryMethodId: z.string().optional(),
      deliveryLocationId: z.string().optional(),

      address: z.string().optional(),
      district: z.string().optional(),
      city: z.string().optional(),
      reference: z.string().optional(),

      /** Código escrito por el cliente; se valida contra la BD aparte */
      couponCode: z.string().optional(),

      acceptTerms: z.boolean(),
      paymentMethod: z.enum(['WHATSAPP_TRANSFER'], { error: 'Selecciona un método de pago' }),
    })
    .superRefine((data, ctx) => {
      if (requiresMethod && !(data.deliveryMethodId ?? '').trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Selecciona una forma de entrega',
          path: ['deliveryMethodId'],
        })
      }

      if (requiresAddress) {
        if ((data.address ?? '').trim().length < 5) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Dirección requerida',
            path: ['address'],
          })
        }
        if ((data.district ?? '').trim().length < 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Distrito requerido',
            path: ['district'],
          })
        }
        if ((data.city ?? '').trim().length < 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Ciudad requerida',
            path: ['city'],
          })
        }
      }

      if (requiresLocation && !(data.deliveryLocationId ?? '').trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Elige la tienda donde recogerás tu pedido',
          path: ['deliveryLocationId'],
        })
      }

      if (!data.acceptTerms) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Debes aceptar los Términos y Condiciones',
          path: ['acceptTerms'],
        })
      }
    })
}

/** Variante base — sirve de tipo y de fallback cuando no hay método elegido */
export const checkoutSchema = buildCheckoutSchema({
  requiresMethod: false,
  requiresAddress: true,
  requiresLocation: false,
})

export type CheckoutInput = z.infer<typeof checkoutSchema>
