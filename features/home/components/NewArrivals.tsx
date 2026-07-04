import { ProductCard } from '@/features/products/components/ProductCard'
import { toProductCards } from '@/features/products/lib/product-card'
import { getNewProducts } from '@/features/products/queries/product.queries'
import { getPublicStockFilter } from '@/features/settings/queries/store-settings.queries'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

// Cantidad fija con filas completas (2 cols en móvil, 4 en desktop) para que
// nunca queden tarjetas cortadas; el resto se ve con "Ver todos".
const NEW_ARRIVALS_COUNT = 4

// Server Component — no necesita "use client"
export async function NewArrivals() {
  const products = await getNewProducts(NEW_ARRIVALS_COUNT, await getPublicStockFilter())
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
        <Link
          href="/catalogo?sort=newest"
          className="font-display text-[15px] font-bold tracking-[1px] uppercase pb-0.5 text-muted hover:text-(--gold) transition-colors duration-300 inline-flex items-center"
        >
          Ver todos
          <ArrowRight className="ml-1" size={14} />
        </Link>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
