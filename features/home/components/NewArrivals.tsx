import { toProductCards } from '@/features/products/services/product.mapper'
import { productRepo } from '@/features/products/services/product.service'
import { ProductCard } from '@/features/products/components/ProductCard'

// Server Component — no necesita "use client"
export async function NewArrivals() {
  const products = await productRepo.findNew(6)
  const items = toProductCards(products)

  if (items.length === 0) return null

  return (
    <section className="px-12 py-20">
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

      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
