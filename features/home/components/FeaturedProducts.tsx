import { ProductCard } from '@/features/products/components/ProductCard'
import { toProductCards } from '@/features/products/lib/product-card'
import { getFeaturedProducts, getProducts } from '@/features/products/queries/product.queries'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export async function FeaturedProducts() {
  const featured = await getFeaturedProducts(5)

  let source = featured

  if (featured.length < 5) {
    const recent = await getProducts({ take: 5 })

    source = [
      ...featured,
      ...recent.filter((product) => !featured.some((f) => f.id === product.id)),
    ].slice(0, 5)
  }

  const items = toProductCards(source.slice(0, 5))

  if (items.length === 0) return null

  return (
    <section className="glow-section shell py-20">
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
        <Link
          href="/catalogo"
          className="hover:text-(--gold) transition-colors duration-200 font-display inline-flex items-center text-[15px] font-bold tracking-[1px] uppercase no-underline border-b border-transparent pb-0.5 text-muted"
        >
          Ver catálogo
          <ArrowRight size={14} className="inline-block ml-1" strokeWidth={3} />
        </Link>
      </div>

      <div className="relative z-1 grid gap-4 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
