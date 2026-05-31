import { orderRepo } from "@/modules/orders/repositories/order.repo";
import { OrdersClient } from "@/features/orders/components/OrdersClient";

export default async function OrdersPage() {
  const [orders, stats] = await Promise.all([
    orderRepo.findMany({ take: 100 }),
    orderRepo.getStats(),
  ]);

  return <OrdersClient initialOrders={orders} initialStats={stats} />;
}
