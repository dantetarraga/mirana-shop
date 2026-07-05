import { getBrands } from "@/features/brands/queries/brand.queries";
import { getCategories } from "@/features/categories/queries/category.queries";
import { CatalogFilters } from "@/features/products/components/CatalogFilters";
import { CatalogPagination } from "@/features/products/components/CatalogPagination";
import { CatalogSortSelect } from "@/features/products/components/CatalogSortSelect";
import { ProductCard } from "@/features/products/components/ProductCard";
import { resolveAvailability, type AvailabilityOption } from "@/features/products/lib/availability";
import { toProductCards } from "@/features/products/lib/product-card";
import { countProducts, getProducts } from "@/features/products/queries/product.queries";
import { getPublicStockFilter } from "@/features/settings/queries/store-settings.queries";
import type { ProductSort } from "@/features/products/types";
import type { Metadata } from "next";

const PAGE_SIZE = 24;
const VALID_SORTS: ProductSort[] = ["relevance", "price_asc", "price_desc", "newest"];
const VALID_AVAIL: AvailabilityOption[] = ["in_stock", "low_stock", "preorder"];

interface PageProps {
  searchParams: Promise<{
    cat?: string;
    brand?: string;
    q?: string;
    priceMin?: string;
    priceMax?: string;
    avail?: string;
    oferta?: string;
    sort?: string;
    page?: string;
  }>;
}

function parseCsv(value: string | undefined): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  // Canonical siempre apunta a /catalogo sin query params — el listado filtrado
  // no debe indexarse como URL propia, evita duplicación por combinatoria de filtros.
  const base: Metadata = { alternates: { canonical: "/catalogo" } };

  const cats = parseCsv(params.cat);
  const brandSlugs = parseCsv(params.brand);
  if (brandSlugs.length === 1 && cats.length === 0) {
    const brands = await getBrands({ perPage: 50 });
    const brand = brands.find((b) => b.slug === brandSlugs[0]);
    if (brand) return { ...base, title: `Figuras de ${brand.name}` };
  }

  return base;
}

export default async function CatalogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const cats = parseCsv(params.cat);
  const brandSlugs = parseCsv(params.brand);
  const avail = parseCsv(params.avail).filter((a): a is AvailabilityOption =>
    VALID_AVAIL.includes(a as AvailabilityOption),
  );
  const priceMin = params.priceMin ? Number(params.priceMin) : undefined;
  const priceMax = params.priceMax ? Number(params.priceMax) : undefined;
  const sort: ProductSort = VALID_SORTS.includes(params.sort as ProductSort)
    ? (params.sort as ProductSort)
    : "relevance";
  const page = Math.max(1, Number(params.page) || 1);
  const q = params.q || undefined;
  const onSale = params.oferta === "1" || undefined;

  const { status, stockFilter } = resolveAvailability(avail);
  const publicStockFilter = await getPublicStockFilter();

  const productFilters = {
    categorySlug: cats.length > 0 ? cats : undefined,
    brandSlug: brandSlugs.length > 0 ? brandSlugs : undefined,
    search: q,
    priceMin,
    priceMax,
    status,
    stockFilter: stockFilter ?? publicStockFilter,
    onSale,
    sort,
  };

  const [products, total, categories, brands] = await Promise.all([
    getProducts({ ...productFilters, take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE }),
    countProducts(productFilters),
    getCategories({ perPage: 50 }),
    getBrands({ perPage: 50 }),
  ]);

  const items = toProductCards(products);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const baseParams = { q, cat: cats, brand: brandSlugs, avail, oferta: onSale, priceMin, priceMax, sort };

  return (
    <section className="shell pb-20 pt-[calc(var(--nh)+36px)]">
      <div className="text-[10px] font-bold tracking-[3px] uppercase mb-1.5 text-(--gold)">
        Tienda completa
      </div>
      <h1 className="font-display font-black uppercase tracking-[-1px] m-0 mb-6 leading-[0.95] text-[clamp(36px,5vw,64px)]">
        Catálogo
      </h1>

      <div className="flex flex-col lg:grid lg:grid-cols-[260px_1fr] gap-6 lg:gap-8 lg:items-start">
        <CatalogFilters
          categories={categories}
          brands={brands}
          currentQ={q}
          currentSort={sort}
          currentCats={cats}
          currentBrands={brandSlugs}
          currentAvail={avail}
          currentOferta={onSale}
          priceMin={priceMin}
          priceMax={priceMax}
        />

        <div>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-baseline gap-2.5">
              <span className="font-display text-[42px] font-black leading-none">{total}</span>
              <span className="text-[12px] text-muted tracking-[1px] uppercase">productos</span>
            </div>
            <CatalogSortSelect
              value={sort}
              q={q}
              cat={cats}
              brand={brandSlugs}
              avail={avail}
              oferta={onSale}
              priceMin={priceMin}
              priceMax={priceMax}
            />
          </div>

          {items.length === 0 ? (
            <div className="text-center py-20 px-5 text-muted">
              <div className="font-display text-[28px] font-black uppercase mb-2">Sin resultados</div>
              <div className="text-[14px]">Prueba ajustando los filtros</div>
            </div>
          ) : (
            <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          <CatalogPagination currentPage={page} totalPages={totalPages} baseParams={baseParams} />
        </div>
      </div>
    </section>
  );
}
