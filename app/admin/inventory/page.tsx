import { productRepo, type StockFilter } from "@/modules/catalog/repositories/product.repo";
import { inventoryRepo } from "@/modules/inventory/repositories/inventory.repo";
import { InventoryClient } from "@/features/inventory/components/InventoryClient";

const VALID_FILTERS = new Set<StockFilter>(["all", "low", "out"]);

interface PageProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function InventoryPage({ searchParams }: PageProps) {
  const { filter: rawFilter } = await searchParams;
  const stockFilter: StockFilter =
    rawFilter && VALID_FILTERS.has(rawFilter as StockFilter)
      ? (rawFilter as StockFilter)
      : "all";

  const [products, stats] = await Promise.all([
    productRepo.findMany({ stockFilter, status: undefined, take: 500 }),
    inventoryRepo.getStats(),
  ]);

  const serializedProducts = products.map((p) => ({
    ...p,
    price:          Number(p.price),
    compareAtPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : null,
  }));

  return (
    <InventoryClient
      initialProducts={serializedProducts}
      initialStats={stats}
      currentFilter={stockFilter}
    />
  );
}
