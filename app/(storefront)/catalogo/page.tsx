import { Suspense } from "react";
import { productRepo } from "@/modules/catalog/repositories/product.repo";
import { categoryRepo } from "@/modules/catalog/repositories/category.repo";
import { toProductCards } from "@/modules/catalog/mappers/product.mapper";
import { CatalogClient } from "@/features/storefront/catalog/components/CatalogClient";

// Server Component — fetcha categorías y productos iniciales
export default async function CatalogPage() {
  const [products, categories] = await Promise.all([
    productRepo.findMany({ take: 200 }),
    categoryRepo.findAll(),
  ]);

  const items = toProductCards(products);

  return (
    <Suspense>
      <CatalogClient initialProducts={items} categories={categories} />
    </Suspense>
  );
}
