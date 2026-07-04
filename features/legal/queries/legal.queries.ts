import { db } from '@/shared/lib/db'

// ---------------------------------------------------------------------------
// Páginas legales — contenido editable desde /admin/legal
// ---------------------------------------------------------------------------

export const LEGAL_SLUGS = {
  terms: 'terminos-y-condiciones',
  privacy: 'politica-de-privacidad',
} as const

export type LegalSlug = (typeof LEGAL_SLUGS)[keyof typeof LEGAL_SLUGS]

export interface LegalPageData {
  slug: string
  title: string
  content: string
  updatedAt: Date
}

export async function getLegalPage(slug: string): Promise<LegalPageData | null> {
  return db.legalPage.findUnique({
    where: { slug },
    select: { slug: true, title: true, content: true, updatedAt: true },
  })
}
