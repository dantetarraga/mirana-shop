import { orderRepo } from "@/modules/orders/repositories/order.repo";
import { productRepo } from "@/modules/catalog/repositories/product.repo";
import { inventoryRepo } from "@/modules/inventory/repositories/inventory.repo";
import { userRepo } from "@/modules/users/repositories/user.repo";
import { DashboardClient } from "@/features/dashboard/components/DashboardClient";

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
    orderRepo.getStats(),
    productRepo.findMany({ take: 10 }),
    inventoryRepo.getStats(),
    userRepo.count(),
    orderRepo.findMany({ take: 6 }),
    orderRepo.getRevenueByMonth(),
    orderRepo.getOrdersByDay(14),
    orderRepo.getOrdersByCategory(),
  ]);

  const serializedOrders = recentOrders.map((o) => ({
    ...o,
    total:        Number(o.total),
    subtotal:     Number(o.subtotal),
    shippingCost: Number(o.shippingCost),
  }));

  const serializedProducts = products.map((p) => ({
    ...p,
    price:          Number(p.price),
    compareAtPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : null,
  }));

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
  );
}
