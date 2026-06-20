import { getProducts } from "@/features/products/queries/product.queries";
import { getCategories } from "@/features/categories/queries/category.queries";
import { toProductCards } from "@/features/products/lib/product-card";
import { ProductCard } from "@/features/products/components/ProductCard";
import { ServerSearchForm } from "@/shared/components/admin/ServerSearchForm";
import { cn } from "@/shared/lib/utils";

interface PageProps {
  searchParams: Promise<{ cat?: string; q?: string }>;
}

function buildUrl(cat: string | undefined, q: string | undefined) {
  const params = new URLSearchParams();
  if (cat) params.set("cat", cat);
  if (q) params.set("q", q);
  const qs = params.toString();
  return qs ? `/catalogo?${qs}` : "/catalogo";
}

// Server Component — filtra productos server-side vía searchParams (?cat=&q=)
export default async function CatalogPage({ searchParams }: PageProps) {
  const { cat, q } = await searchParams;

  const [products, categories] = await Promise.all([
    getProducts({
      categorySlug: cat || undefined,
      search: q || undefined,
      take: 200,
    }),
    getCategories(),
  ]);

  const items = toProductCards(products);

  return (
    <section className="px-12 pb-20 pt-[calc(var(--nh)+36px)]">
      <div className="text-[10px] font-bold tracking-[3px] uppercase mb-1.5 text-(--gold)">
        Tienda completa
      </div>
      <div className="flex justify-between items-end mb-1.5">
        <h1 className="font-display font-black uppercase tracking-[-1px] m-0 leading-[0.95] text-[clamp(36px,5vw,64px)]">
          Catálogo
        </h1>
        <div className="text-[13px] text-muted">{items.length} productos</div>
      </div>

      <div className="h-px my-4 mb-6 bg-(--bd)" />

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap mb-7 items-center">
        <a
          href={buildUrl(undefined, q)}
          className={cn("ui-btn ui-btn--tab ui-btn--sm", !cat && "ui-btn--active")}
        >
          Todos
        </a>
        {categories.map((c) => (
          <a
            key={c.slug}
            href={buildUrl(c.slug, q)}
            className={cn("ui-btn ui-btn--tab ui-btn--sm", cat === c.slug && "ui-btn--active")}
          >
            {c.name}
          </a>
        ))}
        <div className="ml-auto">
          <ServerSearchForm
            placeholder="Buscar..."
            defaultValue={q ?? ""}
            paramName="q"
            extraParams={cat ? { cat } : {}}
          />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 px-5 text-muted">
          <div className="font-display text-[28px] font-black uppercase mb-2">Sin resultados</div>
          <div className="text-[14px]">Prueba con otro término de búsqueda</div>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
