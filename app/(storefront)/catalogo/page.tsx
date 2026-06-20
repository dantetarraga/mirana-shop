import { Suspense } from "react";
import { productRepo } from "@/features/products/services/product.service";
import { categoryRepo } from "@/features/categories/services/category.service";
import { toProductCards } from "@/features/products/services/product.mapper";
import { CatalogClient } from "@/features/products/components/CatalogClient";

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
