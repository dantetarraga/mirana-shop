import { BrandsListClient } from '@/features/brands/components/BrandsListClient'
import { getAdminBrands } from '@/features/brands/queries/brand.queries'
import { verifyAdmin } from '@/shared/lib/require-admin'

export const metadata = { title: 'Marcas — Admin Mirana' }

// Lista completa sin paginar (docs/NAVEGACION-CATALOGO.md §4): el orden se
// define arrastrando, así que hacen falta todas a la vez. La búsqueda es local.
export default async function BrandsPage() {
  await verifyAdmin()
  const brands = await getAdminBrands()
  return <BrandsListClient brands={brands} />
}
