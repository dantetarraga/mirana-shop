import { HomeSectionsClient } from '@/features/home-sections/components/HomeSectionsClient'
import { getAdminHomeSections } from '@/features/home-sections/queries/home-section.queries'

export const metadata = { title: 'Secciones del inicio | Mirana Admin' }

export default async function AdminSectionsPage() {
  const sections = await getAdminHomeSections()
  return <HomeSectionsClient sections={sections} />
}
