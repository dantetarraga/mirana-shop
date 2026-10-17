import { HomeCtaClient } from '@/features/home/components/HomeCtaClient'
import { getHomeCta } from '@/features/home/queries/home-cta.queries'
import { verifyAdmin } from '@/shared/lib/require-admin'

export const metadata = { title: 'CTA de Inicio — Admin' }

export default async function AdminCtaPage() {
  await verifyAdmin()
  const cta = await getHomeCta()
  return <HomeCtaClient initial={cta} />
}
