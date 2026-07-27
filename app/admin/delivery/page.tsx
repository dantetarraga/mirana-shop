import { DeliveryMethodsClient } from '@/features/delivery/components/DeliveryMethodsClient'
import { getAllDeliveryMethods } from '@/features/delivery/queries/delivery.queries'

export const metadata = { title: 'Entregas | Mirana Admin' }

export default async function AdminDeliveryPage() {
  const methods = await getAllDeliveryMethods()
  return <DeliveryMethodsClient methods={methods} />
}
