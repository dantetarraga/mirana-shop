import { DeliveryMethodsClient } from '@/features/delivery/components/DeliveryMethodsClient'
import { getAllDeliveryMethods } from '@/features/delivery/queries/delivery.queries'
import { verifyAdmin } from '@/shared/lib/require-admin'

export const metadata = { title: 'Entregas | Mirana Admin' }

export default async function AdminDeliveryPage() {
  await verifyAdmin()
  const methods = await getAllDeliveryMethods()
  return <DeliveryMethodsClient methods={methods} />
}
