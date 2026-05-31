import { productRepo } from "@/modules/catalog/repositories/product.repo";
import { categoryRepo } from "@/modules/catalog/repositories/category.repo";
import { brandRepo } from "@/modules/catalog/repositories/brand.repo";
import { ProductsClient } from "@/features/products/components/ProductsClient";

const PER_PAGE = 30;

interface PageProps {
  searchParams: Promise<{ q?: string; cat?: string; page?: string }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const { q, cat, page: rawPage } = await searchParams;
  const page = Math.max(1, Number(rawPage ?? 1));
  const skip = (page - 1) * PER_PAGE;

  const categorySlug = cat && cat !== "all" ? cat : undefined;

  const [products, categories, brands, total] = await Promise.all([
    productRepo.findMany({
      search: q,
      categorySlug,
      status: undefined, // todos los estados en admin
      take: PER_PAGE,
      skip,
    }),
    categoryRepo.findAll(),
    brandRepo.findAll(),
    productRepo.count({ search: q, categorySlug, status: undefined }),
  ]);

  // Serializar Decimals
  const serializedProducts = products.map((p) => ({
    ...p,
    price:          Number(p.price),
    compareAtPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : null,
  }));

  return (
    <ProductsClient
      initialProducts={serializedProducts}
      categories={categories}
      brands={brands}
      total={total}
      currentPage={page}
      perPage={PER_PAGE}
      currentQ={q ?? ""}
      currentCat={cat ?? "all"}
    />
  );
}
