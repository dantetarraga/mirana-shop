import { LegalPageView } from '@/features/legal/components/LegalPageView'
import { LEGAL_SLUGS } from '@/features/legal/queries/legal.queries'

export const metadata = {
  title: 'Términos y Condiciones — Mirana Shop',
  description: 'Términos y condiciones de uso de la tienda MIRANA.',
}

export default function TermsPage() {
  return <LegalPageView slug={LEGAL_SLUGS.terms} fallbackTitle="Términos y Condiciones" />
}
