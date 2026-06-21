import { getProducts } from '@/features/products/queries/product.queries'
import { Button } from '@/shared/components/ui/Button'

const STRIPE_MAP: Record<string, string> = {
  'figuras-accion': 'stripe-fig',
  lego: 'stripe-lego',
  'modelos-escala': 'stripe-veh',
  anime: 'stripe-fig',
}

export async function PreorderSection() {
  const preorders = await getProducts({
    status: 'PREORDER',
    take: 6,
  })

  if (preorders.length === 0) return null

  return (
    <section className="shell py-20">
      <div className="mb-8">
        <div className="text-[10px] font-bold tracking-[3px] uppercase text-(--gold) mb-2.5">
          Disponibles pronto
        </div>
        <h2 className="font-display font-black uppercase tracking-[-1px] leading-[0.95] text-[clamp(36px,5vw,64px)]">
          Preventas
        </h2>
        <div className="text-[14px] text-muted mt-2">
          Reserva con adelanto del 50% y asegura tu pieza
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
        {preorders.map((p) => {
          const imageUrl = p.images[0]?.url ?? null
          const stripe = STRIPE_MAP[p.category.slug] ?? 'stripe-fig'
          const price = Number(p.price)
          const salePrice = p.compareAtPrice ? Number(p.compareAtPrice) : null

          return (
            <div key={p.id} className="bg-card border border-(--bd) cursor-pointer">
              {/* Visual */}
              <div className={`${stripe} h-50 relative flex items-center justify-center`}>
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={p.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                  />
                ) : (
                  <span className="font-mono text-[10px] tracking-[2px] text-muted uppercase">
                    preventa
                  </span>
                )}
                <div className="absolute top-3 left-0 bg-(--gold) text-black text-[9px] font-extrabold tracking-[2px] uppercase px-2.5 py-1.25">
                  PREVENTA
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <div className="text-[10px] tracking-[2px] uppercase text-muted mb-1">
                  {p.brand.name}
                </div>
                <div className="font-display text-[20px] font-black uppercase tracking-[-0.3px] mb-2">
                  {p.name}
                </div>
                <div className="flex justify-between items-center mb-4">
                  <div className="font-display text-[24px] font-black text-(--gold)">
                    S/ {price.toFixed(2)}
                  </div>
                  {salePrice && (
                    <div className="text-[11px] text-muted line-through">
                      S/ {salePrice.toFixed(2)}
                    </div>
                  )}
                </div>
                <Button variant="outline" size="sm" full>
                  Reservar ahora
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
