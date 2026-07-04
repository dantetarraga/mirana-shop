import { HomeCtaClient } from '@/features/home/components/HomeCtaClient'
import { getHomeCta } from '@/features/home/queries/home-cta.queries'

export const metadata = { title: 'CTA de Inicio — Admin' }

export default async function AdminCtaPage() {
  const cta = await getHomeCta()
  return <HomeCtaClient initial={cta} />
}
