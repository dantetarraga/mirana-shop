import { productRepo } from "@/modules/catalog/repositories/product.repo";
import { toProductCards } from "@/modules/catalog/mappers/product.mapper";
import { ProductCard } from "@/shared/components/ProductCard";

// Server Component — fetcha directamente desde el repo
export async function FeaturedProducts() {
  // Primero busca destacados, si no hay suficientes completa con recientes
  const [featured, recent] = await Promise.all([
    productRepo.findFeatured(8),
    productRepo.findMany({ take: 8 }),
  ]);

  const source = featured.length >= 4 ? featured : recent;
  const items = toProductCards(source.slice(0, 8));

  if (items.length === 0) return null;

  return (
    <section className="px-12 py-20">
      <div className="flex justify-between items-end mb-8">
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

      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
