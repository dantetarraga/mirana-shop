import { productRepo } from "@/modules/catalog/repositories/product.repo";
import { categoryRepo } from "@/modules/catalog/repositories/category.repo";
import { brandRepo } from "@/modules/catalog/repositories/brand.repo";
import { ProductsClient } from "@/features/products/components/ProductsClient";

// Server Component — fetchea datos y los pasa al Client Component
export default async function ProductsPage() {
  const [products, categories, brands] = await Promise.all([
    productRepo.findMany({ take: 200 }),
    categoryRepo.findAll(),
    brandRepo.findAll(),
  ]);

  return (
    <ProductsClient
      initialProducts={products}
      categories={categories}
      brands={brands}
    />
  );
}
