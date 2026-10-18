import { z } from 'zod'

// ---------------------------------------------------------------------------
// Reseñas de producto. El mismo schema valida en el cliente (ReviewForm) y en
// el servidor (submitReview).
//
// Solo texto plano: se quitan etiquetas HTML y caracteres de control antes de
// medir la longitud. Al renderizar React escapa el contenido; nunca se usa
// dangerouslySetInnerHTML con una reseña.
// ---------------------------------------------------------------------------

export const REVIEW_TITLE_MAX = 120
export const REVIEW_BODY_MIN = 10
export const REVIEW_BODY_MAX = 2000

/**
 * Normaliza texto libre del cliente a texto plano:
 * - quita etiquetas tipo `<b>`, `<script>…` (solo la etiqueta, no el texto);
 * - quita caracteres de control salvo el salto de línea;
 * - normaliza saltos de línea y colapsa más de dos seguidos;
 * - recorta espacios al inicio y al final.
 */
export function toPlainText(value: string): string {
  return (
    value
      .replace(/\r\n?/g, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  )
}

const plainText = z.string().transform(toPlainText)

export const reviewInputSchema = z.object({
  productId: z.string().trim().min(1, 'Producto inválido').max(64, 'Producto inválido'),
  rating: z
    .number({ error: 'Elige una calificación' })
    .int('Elige una calificación')
    .min(1, 'Elige una calificación')
    .max(5, 'Elige una calificación'),
  title: plainText
    .pipe(z.string().max(REVIEW_TITLE_MAX, `El título admite hasta ${REVIEW_TITLE_MAX} caracteres`))
    .optional()
    .transform((v) => (v ? v : undefined)),
  body: plainText.pipe(
    z
      .string()
      .min(REVIEW_BODY_MIN, `Cuéntanos un poco más: mínimo ${REVIEW_BODY_MIN} caracteres`)
      .max(REVIEW_BODY_MAX, `La opinión admite hasta ${REVIEW_BODY_MAX} caracteres`),
  ),
})

export type ReviewInput = z.input<typeof reviewInputSchema>
export type ReviewData = z.output<typeof reviewInputSchema>

export const REVIEW_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const
export type ReviewStatusValue = (typeof REVIEW_STATUSES)[number]

export const reviewIdSchema = z.object({ reviewId: z.string().trim().min(1).max(64) })
