import { MediaLibraryClient } from '@/features/uploads/components/MediaLibraryClient'
import { verifyAdmin } from '@/shared/lib/require-admin'

export const metadata = { title: 'Imágenes — Admin Mirana' }

export default async function AdminMediaPage() {
  await verifyAdmin()
  return <MediaLibraryClient />
}
