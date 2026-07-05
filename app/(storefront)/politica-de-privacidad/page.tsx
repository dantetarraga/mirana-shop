import { LegalPageView } from '@/features/legal/components/LegalPageView'
import { LEGAL_SLUGS } from '@/features/legal/queries/legal.queries'

export const metadata = {
  title: 'Política de Privacidad — Mirana Shop',
  description: 'Política de privacidad y tratamiento de datos personales de MIRANA.',
}

export default function PrivacyPage() {
  return <LegalPageView slug={LEGAL_SLUGS.privacy} fallbackTitle="Política de Privacidad" />
}
