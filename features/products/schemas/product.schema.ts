import { imageUrlSchema } from '@/shared/schemas/image-url.schema'
import { isRichTextEmpty, sanitizeRichText, toRichHtml } from '@/shared/lib/rich-text'
import { z } from 'zod'

// La descripción viaja como HTML del editor enriquecido (TipTap). Se sanea
// siempre — se pinta con dangerouslySetInnerHTML en la ficha de producto — y
// un documento "vacío" del editor (`<p></p>`) se normaliza a cadena vacía.
const richTextSchema = z
  .string()
  .max(50_000, 'Descripción demasiado larga')
  .transform((v) => (isRichTextEmpty(v) ? '' : sanitizeRichText(v)))

// La columna del Excel llega en texto plano (a veces con marcas Markdown):
// se guarda ya convertida a HTML para no depender de la conversión al vuelo.
const importDescriptionSchema = richTextSchema.transform(toRichHtml)

// ---------------------------------------------------------------------------
// Productos — schema para BD real (Server Actions)
// ---------------------------------------------------------------------------

export const productDbBaseSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  slug: z
    .string()
    .min(1, 'Slug requerido')
    .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  sku: z.string().min(1, 'SKU requerido'),
  description: richTextSchema.optional().default(''),
  price: z.number({ error: 'Precio requerido' }).positive('Debe ser mayor a 0'),
  salePrice: z.preprocess(
    (v) => (v === '' || v === null || (typeof v === 'number' && isNaN(v)) ? undefined : v),
    z.number().positive('Debe ser mayor a 0').optional(),
  ),
  stock: z.number({ error: 'Cantidad requerida' }).int().min(0, 'No puede ser negativo'),
  categoryId: z.string().min(1, 'Categoría requerida'),
  brandId: z.string().min(1, 'Marca requerida'),
  status: z
    .enum(['AVAILABLE', 'PREORDER', 'SOLD_OUT', 'COMING_SOON', 'ARCHIVED'])
    .default('AVAILABLE'),
  featured: z.boolean().default(false),
  imageUrl: imageUrlSchema().optional(),
})

export const productDbSchema = productDbBaseSchema.superRefine((data, ctx) => {
  if (data.salePrice !== undefined && data.salePrice > data.price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El precio de oferta no puede ser mayor al precio base',
      path: ['salePrice'],
    })
  }
})

export type ProductDbInput = z.infer<typeof productDbSchema>

// ---------------------------------------------------------------------------
// Importación masiva de productos
// ---------------------------------------------------------------------------

export const importProductRowSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  // Nombre o slug de la categoría — se resuelve contra la BD al importar
  cat: z.string().min(1),
  price: z.number().positive(),
  salePrice: z.preprocess(
    (v) => (v === '' || v === null || (typeof v === 'number' && isNaN(v)) ? undefined : v),
    z.number().positive().optional(),
  ),
  stock: z.number().int().min(0),
  brand: z.string().optional().default(''),
  desc: importDescriptionSchema.optional().default(''),
  status: z.enum(['AVAILABLE', 'PREORDER', 'SOLD_OUT', 'COMING_SOON', 'ARCHIVED']).optional().default('AVAILABLE'),
  featured: z.preprocess(
    (v) => {
      if (typeof v === 'boolean') return v
      if (typeof v === 'string') return v.toLowerCase() === 'true' || v === '1' || v.toLowerCase() === 'si' || v.toLowerCase() === 'sí'
      return false
    },
    z.boolean().default(false),
  ),
  imageUrls: z.array(z.string().url('URL de imagen inválida')).optional().default([]),
}).superRefine((data, ctx) => {
  if (data.salePrice !== undefined && data.salePrice > data.price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El precio de oferta no puede ser mayor al precio base',
      path: ['salePrice'],
    })
  }
})

export type ImportProductRow = z.infer<typeof importProductRowSchema>
