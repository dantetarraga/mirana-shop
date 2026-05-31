import { productRepo } from "@/modules/catalog/repositories/product.repo";
import { inventoryRepo } from "@/modules/inventory/repositories/inventory.repo";
import { InventoryClient } from "@/features/inventory/components/InventoryClient";

export default async function InventoryPage() {
  const [products, stats] = await Promise.all([
    productRepo.findMany({ take: 500 }),
    inventoryRepo.getStats(),
  ]);

  return <InventoryClient initialProducts={products} initialStats={stats} />;
}
