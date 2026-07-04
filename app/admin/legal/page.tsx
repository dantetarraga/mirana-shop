import { LegalPagesClient } from '@/features/legal/components/LegalPagesClient'
import { LEGAL_SLUGS, getLegalPage } from '@/features/legal/queries/legal.queries'

export const metadata = { title: 'Páginas legales — Admin' }

export default async function AdminLegalPage() {
  const [terms, privacy] = await Promise.all([
    getLegalPage(LEGAL_SLUGS.terms),
    getLegalPage(LEGAL_SLUGS.privacy),
  ])

  return (
    <LegalPagesClient
      terms={{
        slug: LEGAL_SLUGS.terms,
        title: terms?.title ?? 'Términos y Condiciones',
        content: terms?.content ?? '',
      }}
      privacy={{
        slug: LEGAL_SLUGS.privacy,
        title: privacy?.title ?? 'Política de Privacidad',
        content: privacy?.content ?? '',
      }}
    />
  )
}
