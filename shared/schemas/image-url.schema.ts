import { z } from 'zod'
import { isAllowedHttpUrl } from '@/shared/schemas/safe-url.schema'

/**
 * Acepta URL absoluta (https://...) o ruta interna (/uploads/..., servida por el propio
 * servidor) — mismo patrón que `ctaHref` en banners. Necesario porque las imágenes subidas
 * vía ImageUploadField devuelven una ruta relativa, no una URL absoluta.
 */
export function imageUrlSchema(message = 'URL de imagen inválida') {
  return z
    .string()
    .trim()
    .max(2_000, 'URL de imagen demasiado larga')
    .refine(
      (value) =>
        isAllowedHttpUrl(value) || (value.startsWith('/') && !value.startsWith('//')),
      message,
    )
}
