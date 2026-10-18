import { z } from 'zod'

// ---------------------------------------------------------------------------
// Hoja de Reclamación (Anexo I del D.S. 011-2011-PCM). El mismo schema valida
// en el cliente (react-hook-form) y en el servidor (createComplaint).
// ---------------------------------------------------------------------------

export const DOC_TYPES = ['DNI', 'CE', 'PASAPORTE'] as const
export type DocType = (typeof DOC_TYPES)[number]

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  DNI: 'DNI',
  CE: 'Carné de extranjería',
  PASAPORTE: 'Pasaporte',
}

/** Tope del monto reclamado (S/). Decimal(10,2) admite más, pero evita errores de tipeo. */
export const MAX_CLAIMED_AMOUNT = 1_000_000

/** Mensaje de error del número de documento según su tipo, o null si es válido. */
export function docNumberError(docType: string, docNumber: string): string | null {
  const value = docNumber.trim()
  switch (docType) {
    case 'DNI':
      return /^\d{8}$/.test(value) ? null : 'El DNI debe tener 8 dígitos'
    case 'CE':
      return /^[A-Za-z0-9]{9,12}$/.test(value)
        ? null
        : 'El carné de extranjería debe tener de 9 a 12 caracteres alfanuméricos'
    case 'PASAPORTE':
      return /^[A-Za-z0-9]{6,12}$/.test(value)
        ? null
        : 'El pasaporte debe tener de 6 a 12 caracteres alfanuméricos'
    default:
      return 'Tipo de documento inválido'
  }
}

/** Acepta +, espacios, guiones y paréntesis; exige de 7 a 15 dígitos. */
const PHONE_RE = /^\+?\d{7,15}$/

export const createComplaintSchema = z
  .object({
    fullName: z.string().trim().min(3, 'Ingresa tu nombre completo').max(120, 'Máximo 120 caracteres'),
    docType: z.enum(DOC_TYPES, 'Elige un tipo de documento'),
    docNumber: z.string().trim().max(12, 'Documento inválido'),
    address: z.string().trim().min(5, 'Ingresa tu domicilio').max(250, 'Máximo 250 caracteres'),
    phone: z
      .string()
      .trim()
      .max(30, 'Teléfono inválido')
      .refine((v) => PHONE_RE.test(v.replace(/[\s\-()]/g, '')), 'Ingresa un teléfono válido (7 a 15 dígitos)'),
    email: z.string().trim().toLowerCase().email('Correo inválido').max(254),

    // Menor de edad → datos del padre, madre o apoderado
    isMinor: z.boolean(),
    guardianName: z.string().trim().max(120, 'Máximo 120 caracteres').optional(),
    guardianDocType: z.enum(DOC_TYPES).optional(),
    guardianDocNumber: z.string().trim().max(12, 'Documento inválido').optional(),

    goodType: z.enum(['PRODUCTO', 'SERVICIO'], 'Indica si es un producto o un servicio'),
    orderCode: z
      .string()
      .trim()
      .max(40, 'Máximo 40 caracteres')
      .regex(/^[A-Za-z0-9-]*$/, 'Solo letras, números y guiones')
      .optional(),
    productDescription: z
      .string()
      .trim()
      .min(5, 'Describe el producto o servicio')
      .max(2_000, 'Máximo 2000 caracteres'),
    claimedAmount: z
      .string()
      .trim()
      .optional()
      .refine(
        (v) => !v || (/^\d+(\.\d{1,2})?$/.test(v) && Number(v) <= MAX_CLAIMED_AMOUNT),
        `Monto inválido (hasta S/ ${MAX_CLAIMED_AMOUNT.toLocaleString('es-PE')} con 2 decimales)`,
      ),

    type: z.enum(['RECLAMO', 'QUEJA'], 'Elige reclamo o queja'),
    detail: z
      .string()
      .trim()
      .min(10, 'Describe el detalle de tu reclamo')
      .max(10_000, 'Máximo 10000 caracteres'),
    request: z
      .string()
      .trim()
      .min(5, 'Indica qué pides como solución')
      .max(5_000, 'Máximo 5000 caracteres'),

    truthDeclarationAccepted: z
      .boolean()
      .refine((v) => v === true, 'Debes declarar que la información es verdadera'),
    privacyAccepted: z
      .boolean()
      .refine((v) => v === true, 'Debes aceptar el tratamiento de tus datos personales'),

    /** Honeypot: oculto para personas; si llega con contenido es un bot. */
    extraInfo: z.string().max(200).optional(),
  })
  .superRefine((d, ctx) => {
    const docError = docNumberError(d.docType, d.docNumber)
    if (docError) ctx.addIssue({ code: 'custom', path: ['docNumber'], message: docError })

    if (d.isMinor) {
      if (!d.guardianName || d.guardianName.length < 3) {
        ctx.addIssue({
          code: 'custom',
          path: ['guardianName'],
          message: 'Ingresa el nombre del padre, madre o apoderado',
        })
      }
      if (!d.guardianDocType) {
        ctx.addIssue({ code: 'custom', path: ['guardianDocType'], message: 'Elige un tipo de documento' })
      } else {
        const guardianError = docNumberError(d.guardianDocType, d.guardianDocNumber ?? '')
        if (guardianError) {
          ctx.addIssue({ code: 'custom', path: ['guardianDocNumber'], message: guardianError })
        }
      }
    }
  })

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>

export const respondComplaintSchema = z.object({
  complaintId: z.string().min(1),
  response: z.string().trim().min(3, 'Escribe una respuesta').max(10_000, 'Máximo 10000 caracteres'),
  providerActions: z.string().trim().max(5_000, 'Máximo 5000 caracteres').optional(),
})

export type RespondComplaintInput = z.infer<typeof respondComplaintSchema>
