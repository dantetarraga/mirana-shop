import { z } from 'zod'

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
  description: z.string().optional().default(''),
  price: z.number({ error: 'Precio requerido' }).positive('Debe ser mayor a 0'),
  compareAtPrice: z.number().positive().optional(),
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
  imageUrl: z.string().url('URL de imagen inválida').optional(),
})

export const productDbSchema = productDbBaseSchema.superRefine((data, ctx) => {
  if (data.salePrice !== undefined && data.salePrice >= data.price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El precio de venta debe ser menor al precio base',
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
  cat: z.enum(['figures', 'lego', 'vehicles']),
  price: z.number().positive(),
  stock: z.number().int().min(0),
  brand: z.string().optional().default(''),
  desc: z.string().optional().default(''),
})

export type ImportProductRow = z.infer<typeof importProductRowSchema>
