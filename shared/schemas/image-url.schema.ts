import { z } from 'zod'

/**
 * Acepta URL absoluta (https://...) o ruta interna (/uploads/..., servida por el propio
 * servidor) — mismo patrón que `ctaHref` en banners. Necesario porque las imágenes subidas
 * vía ImageUploadField devuelven una ruta relativa, no una URL absoluta.
 */
export function imageUrlSchema(message = 'URL de imagen inválida') {
  return z.union([z.string().url(message), z.string().startsWith('/', message)])
}
