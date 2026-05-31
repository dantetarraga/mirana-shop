import { orderRepo } from "@/modules/orders/repositories/order.repo";
import { productRepo } from "@/modules/catalog/repositories/product.repo";
import { inventoryRepo } from "@/modules/inventory/repositories/inventory.repo";
import { db } from "@/shared/lib/db";
import { DashboardClient } from "@/features/dashboard/components/DashboardClient";

async function getUserCount() {
  return db.user.count({ where: { deletedAt: null } });
}

export default async function DashboardPage() {
  const [orderStats, products, inventoryStats, userCount] = await Promise.all([
    orderRepo.getStats(),
    productRepo.findMany({ take: 10 }),
    inventoryRepo.getStats(),
    getUserCount(),
  ]);

  return (
    <DashboardClient
      orderStats={orderStats}
      topProducts={products}
      inventoryStats={inventoryStats}
      userCount={userCount}
    />
  );
}
