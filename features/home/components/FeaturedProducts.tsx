import { getFeaturedProducts, getProducts } from "@/features/products/queries/product.queries";
import { toProductCards } from "@/features/products/lib/product-card";
import { ProductCard } from "@/features/products/components/ProductCard";

// Server Component — fetcha directamente desde el repo
export async function FeaturedProducts() {
  // Primero busca destacados, si no hay suficientes completa con recientes
  const [featured, recent] = await Promise.all([
    getFeaturedProducts(8),
    getProducts({ take: 8 }),
  ]);

  const source = featured.length >= 4 ? featured : recent;
  const items = toProductCards(source.slice(0, 8));

  if (items.length === 0) return null;

  return (
    <section className="glow-section px-12 py-20">
      <div className="relative z-1 flex justify-between items-end mb-8">
        <div>
          <div className="text-[10px] font-bold tracking-[3px] uppercase mb-2.5 text-(--gold)">
            Selección premium
          </div>
          <h2 className="font-display font-black uppercase tracking-[-1px] leading-[0.95] text-[clamp(36px,5vw,64px)]">
            Favoritos del
            <br />
            momento
          </h2>
        </div>
        <a
          href="/catalogo"
          className="font-display text-[15px] font-bold tracking-[1px] uppercase no-underline border-b border-transparent pb-0.5 text-muted"
        >
          Ver catálogo →
        </a>
      </div>

      <div className="relative z-1 grid gap-4 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
