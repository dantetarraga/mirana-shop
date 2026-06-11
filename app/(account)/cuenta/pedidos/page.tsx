import { getMyOrders } from '@/features/account/orders/actions/account.actions'
import { OrdersContent } from '@/features/account/orders/components/OrdersContent'
import { OrdersSkeleton } from '@/features/account/orders/components/OrdersSkeleton'
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
