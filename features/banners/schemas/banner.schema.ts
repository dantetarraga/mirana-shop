import { imageUrlSchema } from '@/shared/schemas/image-url.schema'
import { z } from 'zod'

export const bannerSchema = z.object({
  title: z.string().min(1, 'Título requerido'),
  subtitle: z.string().optional().default(''),
  cta: z.string().optional().default(''),
  position: z.string().min(1, 'Posición requerida'),
})

export type BannerInput = z.infer<typeof bannerSchema>

// ---------------------------------------------------------------------------
// Banners — schema para BD real (Server Actions)
// ---------------------------------------------------------------------------

export const bannerDbSchema = z.object({
  // Título e imágenes son opcionales: se admite un banner solo-imagen y uno
  // cargado a medias. La tienda omite los que no tengan ninguna imagen (ver
  // getActiveBanners), así que un borrador nunca llega a mostrarse roto.
  title: z.string().optional().default(''),
  subtitle: z.string().optional().default(''),
  ctaLabel: z.string().optional().default(''),
  ctaHref: z
    .union([
      z.string().url('URL inválida'), // URL absoluta: https://...
      z.string().startsWith('/'), // Ruta interna: /catalogo, /productos/...
      z.literal(''),
    ])
    .optional(),
  imageUrl: z.union([imageUrlSchema(), z.literal('')]).optional().default(''),
  // Imagen alternativa para mobile/tablet. Vacía = se reutiliza la de desktop.
  imageUrlMobile: z.union([imageUrlSchema(), z.literal('')]).optional().default(''),
  // Imagen para el hero a pantalla completa (bannerLayout = FULLSCREEN).
  // Vacía = se reutiliza la de desktop.
  imageUrlFull: z.union([imageUrlSchema(), z.literal('')]).optional().default(''),
  position: z.number().int().min(0).default(0),
  active: z.boolean().default(false),
})

export type BannerDbInput = z.infer<typeof bannerDbSchema>
