import { ProductCard } from '@/features/products/components/ProductCard'
import { toProductCards } from '@/features/products/lib/product-card'
import { getProducts } from '@/features/products/queries/product.queries'
import { getPreorderDepositPercent } from '@/features/settings/queries/store-settings.queries'

export async function PreorderSection() {
  const [preorders, depositPercent] = await Promise.all([
    getProducts({ status: 'PREORDER', take: 6 }),
    getPreorderDepositPercent(),
  ])

  const items = toProductCards(preorders)
  // Antes decía "50%" fijo aunque el adelanto real fuera otro.
  const anyPartial = items.some((p) => p.allowPartialPreorder)

  if (items.length === 0) return null

  return (
    <section className="shell py-14 md:py-20">
      <div className="mb-6 md:mb-8">
        <div className="text-[10px] font-bold tracking-[3px] uppercase text-accent-ink mb-2.5">
          Disponibles pronto
        </div>
        <h2 className="font-display font-black uppercase tracking-[-1px] leading-[0.95] text-[clamp(32px,5vw,64px)]">
          Preventas
        </h2>
        <div className="text-[14px] text-muted mt-2">
          {anyPartial
            ? `Reserva con adelanto desde el ${depositPercent}% y asegura tu pieza`
            : 'Reserva ahora y asegura tu pieza'}
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
