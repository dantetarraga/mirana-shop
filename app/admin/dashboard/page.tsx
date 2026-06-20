import { DashboardClient } from '@/features/dashboard/components/DashboardClient'
import { getProducts } from '@/features/products/queries/product.queries'
import { getInventoryStats } from '@/features/inventory/queries/inventory.queries'
import {
  getOrders,
  getOrderStats,
  getOrdersByCategory,
  getOrdersByDay,
  getRevenueByMonth,
} from '@/features/orders/queries/order.queries'
import { countUsers } from '@/features/users/queries/user.queries'

export default async function DashboardPage() {
  const [
    orderStats,
    products,
    inventoryStats,
    userCount,
    recentOrders,
    revenueByMonth,
    ordersByDay,
    ordersByCategory,
  ] = await Promise.all([
    getOrderStats(),
    getProducts({ take: 10 }),
    getInventoryStats(),
    countUsers(),
    getOrders({ take: 6 }),
    getRevenueByMonth(),
    getOrdersByDay(14),
    getOrdersByCategory(),
  ])

  const serializedOrders = recentOrders.map((o) => ({
    ...o,
    total: Number(o.total),
    subtotal: Number(o.subtotal),
    shippingCost: Number(o.shippingCost),
  }))

  const serializedProducts = products.map((p) => ({
    ...p,
    price: Number(p.price),
    compareAtPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : null,
    salePrice: p.salePrice != null ? Number(p.salePrice) : null,
  }))

  return (
    <DashboardClient
      orderStats={{ ...orderStats, revenue: Number(orderStats.revenue) }}
      topProducts={serializedProducts}
      inventoryStats={inventoryStats}
      userCount={userCount}
      recentOrders={serializedOrders}
      revenueByMonth={revenueByMonth}
      ordersByDay={ordersByDay}
      ordersByCategory={ordersByCategory}
    />
  )
}
