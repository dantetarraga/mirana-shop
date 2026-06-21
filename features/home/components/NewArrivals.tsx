import { toProductCards } from '@/features/products/lib/product-card'
import { getNewProducts } from '@/features/products/queries/product.queries'
import { ProductCard } from '@/features/products/components/ProductCard'

// Server Component — no necesita "use client"
export async function NewArrivals() {
  const products = await getNewProducts(6)
  const items = toProductCards(products)

  if (items.length === 0) return null

  return (
    <section className="shell py-20">
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="text-[10px] font-bold tracking-[3px] uppercase mb-2.5 text-(--gold)">
            Recién llegados
          </div>
          <h2 className="font-display font-black uppercase tracking-[-1px] leading-[0.95] text-[clamp(36px,5vw,64px)]">
            Novedades
          </h2>
        </div>
        <a
          href="/catalogo"
          className="font-display text-[15px] font-bold tracking-[1px] uppercase no-underline border-b border-transparent pb-0.5 text-muted"
        >
          Ver todos →
        </a>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((p) => (
          <div key={p.id} className="w-65 shrink-0">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  )
}
