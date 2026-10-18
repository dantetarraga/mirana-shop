import { imageUrlSchema } from '@/shared/schemas/image-url.schema'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Colecciones — schema base compartido por el formulario (CollectionCrudDrawer)
// y las Server Actions (createCollection / updateCollection). Un solo origen
// para los límites evita que el cliente acepte algo que el servidor rechaza
// (o al revés, como pasaba con las rutas internas /uploads/... de imagen).
// ---------------------------------------------------------------------------

/** Límite de la descripción: el mismo que aplica el servidor al HTML guardado. */
export const COLLECTION_DESCRIPTION_MAX = 50_000

export const collectionSlugSchema = z
  .string()
  .min(1, 'Slug requerido')
  .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones')

export const collectionBaseSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100, 'Máximo 100 caracteres'),
  slug: collectionSlugSchema,
  description: z
    .string()
    .max(COLLECTION_DESCRIPTION_MAX, 'La descripción es demasiado larga')
    .optional(),
  // Acepta URL absoluta o ruta interna (/uploads/...) — lo que devuelve ImageUploadField.
  imageUrl: z.union([imageUrlSchema(), z.literal('')]).optional(),
  active: z.boolean().default(true),
})

// z.input captura los tipos antes de aplicar .default() — compatible con useForm generic
export type CollectionFormValues = z.input<typeof collectionBaseSchema>
