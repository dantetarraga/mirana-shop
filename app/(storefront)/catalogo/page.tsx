import { Suspense } from "react";
import { getProducts } from "@/features/products/queries/product.queries";
import { getCategories } from "@/features/categories/queries/category.queries";
import { toProductCards } from "@/features/products/lib/product-card";
import { CatalogClient } from "@/features/products/components/CatalogClient";

// Server Component — fetcha categorías y productos iniciales
export default async function CatalogPage() {
  const [products, categories] = await Promise.all([
    getProducts({ take: 200 }),
    getCategories(),
  ]);

  const items = toProductCards(products);

  return (
    <Suspense>
      <CatalogClient initialProducts={items} categories={categories} />
    </Suspense>
  );
}
