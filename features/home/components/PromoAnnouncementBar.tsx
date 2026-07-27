import { getPromoBarItems } from '@/features/promotions/queries/promo-bar.queries'
import { Gift, Tag, Truck } from 'lucide-react'

// Íconos por tipo de promo
const ICONS = {
  free_shipping: Truck,
  discount: Tag,
  coupon: Gift,
} as const

// Artículos de relleno que siempre aparecen cuando hay promos activas
const FILLER = [
  'Figuras exclusivas de importación',
  'Preventas con adelanto',
  'Envíos a todo el Perú',
  'Coordina tu pago por WhatsApp',
]

export async function PromoAnnouncementBar() {
  const promos = await getPromoBarItems()
  if (promos.length === 0) return null

  // Para el marquee repetimos los items + relleno dos veces para animación continua
  const allItems = [...promos, ...FILLER.map((t) => ({ kind: 'filler' as const, text: t }))]
  const doubled = [...allItems, ...allItems]

  return (
    <div className="bg-(--gold) text-black py-2.5 overflow-hidden" aria-label="Promociones activas">
      <div className="animate-marquee flex whitespace-nowrap">
        {doubled.map((item, i) => {
          if (item.kind === 'filler') {
            return (
              <span
                key={i}
                className="shrink-0 inline-flex items-center gap-2.5 px-6 font-display text-[11px] sm:text-[12px] font-bold tracking-[2px] uppercase opacity-70"
              >
                {item.text}
                <span aria-hidden className="opacity-40 text-[8px]">
                  ◆
                </span>
              </span>
            )
          }

          const Icon = ICONS[item.kind]
          const isCoupon = item.kind === 'coupon'

          return (
            <span
              key={i}
              className="shrink-0 inline-flex items-center gap-2.5 px-6 font-display text-[12px] sm:text-[13px] font-extrabold tracking-[1.5px] uppercase"
            >
              <Icon size={13} aria-hidden className="shrink-0" />
              {isCoupon ? (
                <>
                  Cupón{' '}
                  <span className="bg-black text-white px-2 py-0.5 text-[11px] font-mono tracking-[1px] font-bold">
                    {item.code}
                  </span>{' '}
                  — {item.text}
                </>
              ) : (
                item.text
              )}
              <span aria-hidden className="opacity-40 text-[8px]">
                ◆
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
