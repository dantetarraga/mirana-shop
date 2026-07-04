import { db } from '@/shared/lib/db'

// ---------------------------------------------------------------------------
// CTA del home — registro único editable desde /admin/cta
// ---------------------------------------------------------------------------

export const HOME_CTA_ID = 'home-cta'

// Valores por defecto (el diseño original) usados hasta que el admin guarde.
export const HOME_CTA_DEFAULTS = {
  title: 'Ediciones\nLimitadas',
  subtitle: 'Piezas por tiempo limitado — no te quedes sin las tuyas',
  ctaLabel: 'Explorar ahora',
  ctaHref: '/catalogo',
  imageUrl: '',
  active: true,
}

export interface HomeCtaData {
  title: string
  subtitle: string
  ctaLabel: string
  ctaHref: string
  /** Imagen de fondo opcional; sin imagen se usa el fondo de color por defecto */
  imageUrl: string
  active: boolean
}

export async function getHomeCta(): Promise<HomeCtaData> {
  const row = await db.homeCta.findUnique({
    where: { id: HOME_CTA_ID },
    select: {
      title: true,
      subtitle: true,
      ctaLabel: true,
      ctaHref: true,
      imageUrl: true,
      active: true,
    },
  })
  return row ?? HOME_CTA_DEFAULTS
}
