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
 * Tope del texto crudo antes de cualquier transformación: un cuerpo enorme (o
 * lleno de `<`) se rechaza sin procesarlo. Holgado (4×) para no penalizar a
 * quien pegue texto con algo de marcado que luego se descarta.
 */
const RAW_FACTOR = 4

/**
 * Quita etiquetas `<…>` en una sola pasada (tiempo lineal). Equivale a
 * `/<[^>]*>/g` pero sin el retroceso cuadrático de la regex ante muchos `<`
 * sin cerrar: si un `<` no tiene `>` posterior, el resto se conserva tal cual.
 */
function stripTags(value: string): string {
  let out = ''
  let i = 0
  while (i < value.length) {
    const open = value.indexOf('<', i)
    if (open === -1) {
      out += value.slice(i)
      break
    }
    const close = value.indexOf('>', open + 1)
    if (close === -1) {
      // No hay más `>`: ningún `<` restante puede cerrar una etiqueta.
      out += value.slice(i)
      break
    }
    out += value.slice(i, open)
    i = close + 1
  }
  return out
}

/**
 * Normaliza texto libre del cliente a texto plano:
 * - quita etiquetas tipo `<b>`, `<script>…` (solo la etiqueta, no el texto);
 * - quita caracteres de control salvo el salto de línea;
 * - normaliza saltos de línea y colapsa más de dos seguidos;
 * - recorta espacios al inicio y al final.
 */
export function toPlainText(value: string): string {
  return stripTags(value.replace(/\r\n?/g, '\n'))
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Texto plano con tope previo sobre el valor crudo (antes de transformar). */
const plainText = (max: number, message: string) =>
  z.string().max(max * RAW_FACTOR, message).transform(toPlainText)

export const reviewInputSchema = z.object({
  productId: z.string().trim().min(1, 'Producto inválido').max(64, 'Producto inválido'),
  rating: z
    .number({ error: 'Elige una calificación' })
    .int('Elige una calificación')
    .min(1, 'Elige una calificación')
    .max(5, 'Elige una calificación'),
  title: plainText(REVIEW_TITLE_MAX, `El título admite hasta ${REVIEW_TITLE_MAX} caracteres`)
    .pipe(z.string().max(REVIEW_TITLE_MAX, `El título admite hasta ${REVIEW_TITLE_MAX} caracteres`))
    .optional()
    .transform((v) => (v ? v : undefined)),
  body: plainText(REVIEW_BODY_MAX, `La opinión admite hasta ${REVIEW_BODY_MAX} caracteres`).pipe(
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

/**
 * Aprobar/rechazar: además del id, el `updatedAt` (ISO) de la versión que el
 * admin tenía en pantalla, para no moderar una edición que no vio.
 */
export const reviewModerationSchema = reviewIdSchema.extend({
  seenUpdatedAt: z.iso.datetime({ offset: true }).transform((v) => new Date(v)),
})
