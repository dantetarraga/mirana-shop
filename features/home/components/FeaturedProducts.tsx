import { ProductCard } from '@/features/products/components/ProductCard'
import { toProductCards } from '@/features/products/lib/product-card'
import { getFeaturedProducts, getProducts } from '@/features/products/queries/product.queries'
import { getHideOutOfStock } from '@/features/settings/queries/store-settings.queries'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

// Cantidad fija con filas completas (2 cols en móvil, 4 en desktop) para que
// nunca queden tarjetas cortadas ni filas incompletas.
const FEATURED_COUNT = 4

export async function FeaturedProducts() {
  const featured = await getFeaturedProducts(FEATURED_COUNT)

  let source = featured

  if (featured.length < FEATURED_COUNT) {
    const recent = await getProducts({
      take: FEATURED_COUNT,
      hideOutOfStock: await getHideOutOfStock(),
    })

    source = [
      ...featured,
      ...recent.filter((product) => !featured.some((f) => f.id === product.id)),
    ].slice(0, FEATURED_COUNT)
  }

  const items = toProductCards(source.slice(0, FEATURED_COUNT))

  if (items.length === 0) return null

  return (
    <section className="glow-section shell py-14 md:py-20">
      <div className="relative z-1 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-6 md:mb-8">
        <div>
          <div className="text-[10px] font-bold tracking-[3px] uppercase mb-2.5 text-(--gold)">
            Selección premium
          </div>
          <h2 className="font-display font-black uppercase tracking-[-1px] leading-[0.95] text-[clamp(32px,5vw,64px)]">
            Favoritos del
            <br />
            momento
          </h2>
        </div>
        <Link
          href="/catalogo"
          className="hover:text-(--gold) transition-colors duration-200 font-display inline-flex items-center text-[15px] font-bold tracking-[1px] uppercase no-underline border-b border-transparent pb-0.5 text-muted"
        >
          Ver todos
          <ArrowRight size={14} className="inline-block ml-1" strokeWidth={3} />
        </Link>
      </div>

      <div className="relative z-1 grid gap-4 grid-cols-2 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
