import { getMyOrders } from '@/features/orders/actions/account-orders.actions'
import { OrdersContent } from '@/features/orders/components/OrdersContent'
import { OrdersSkeleton } from '@/features/orders/components/OrdersSkeleton'
import { getAccountUser } from '@/shared/lib/get-account-user'
import { Suspense } from 'react'

export default async function MisPedidosPage() {
  const user = await getAccountUser()
  const ordersPromise = getMyOrders(user.email)

  return (
    <Suspense fallback={<OrdersSkeleton />}>
      <OrdersContent ordersPromise={ordersPromise} />
    </Suspense>
  )
}
