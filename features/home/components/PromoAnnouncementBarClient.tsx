'use client'

import type { PromoBarItem } from '@/features/promotions/queries/promo-bar.queries'
import { Gift, Tag, Truck, X } from 'lucide-react'

const ICONS = {
  free_shipping: Truck,
  discount: Tag,
  coupon: Gift,
} as const

const STORAGE_KEY = 'mirana-promo-bar-v1'
const DISMISSED_CLASS = 'promo-dismissed'

/**
 * Corre ANTES del primer pintado (script inline en el HTML del SSR): si el
 * cliente ya cerró la barra, marca <html> y el CSS (globals.css) pone
 * `--ab: 0px` y oculta la barra. Antes se leía localStorage al hidratar y el
 * navbar y el contenido saltaban 36px hacia arriba en cada carga.
 */
const NO_FLASH_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(STORAGE_KEY)})==='1')document.documentElement.classList.add(${JSON.stringify(DISMISSED_CLASS)})}catch(e){}`

interface Props {
  items: PromoBarItem[]
}

export function PromoAnnouncementBarClient({ items }: Props) {
  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // Modo privado / almacenamiento bloqueado: se cierra solo por esta visita.
    }
    document.documentElement.classList.add(DISMISSED_CLASS)
  }

  const renderItems = (hidden: boolean) =>
    items.map((item, i) => {
      const Icon = ICONS[item.kind]
      const isCoupon = item.kind === 'coupon'
      return (
        <span
          key={`${hidden ? 'b' : 'a'}-${i}`}
          className="shrink-0 inline-flex items-center gap-2 px-8 font-display text-[12px] font-bold tracking-[1.5px] uppercase"
        >
          <Icon size={12} aria-hidden className="shrink-0 opacity-80" />
          {isCoupon ? (
            <>
              Cupón{' '}
              <span className="bg-on-promo text-promo px-1.5 py-0.5 text-[11px] font-mono tracking-[1px] font-bold">
                {item.code}
              </span>{' '}
              — {item.text}
            </>
          ) : (
            item.text
          )}
          <span aria-hidden className="opacity-40 text-[8px] mx-2">
            ◆
          </span>
        </span>
      )
    })

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      {/* role="region" y no "banner": el sitio ya tiene un landmark banner y
          dos confunden la navegación por landmarks. */}
      <div
        data-promo-bar
        role="region"
        aria-label="Promociones activas"
        className="fixed top-0 left-0 right-0 z-500 h-9 bg-promo text-on-promo flex items-center overflow-hidden"
      >
        {/* Marquee: se pausa con hover o con foco en el botón de cerrar
            (globals.css, WCAG 2.2.2). La segunda copia
            solo existe para el bucle visual y queda oculta a lectores. */}
        <div className="flex-1 overflow-hidden">
          <div className="animate-marquee flex w-max whitespace-nowrap">
            {renderItems(false)}
            <span aria-hidden className="contents">
              {renderItems(true)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar barra de promociones"
          className="shrink-0 flex items-center justify-center w-11 h-9 opacity-75 hover:opacity-100 transition-opacity duration-150"
        >
          <X size={15} aria-hidden />
        </button>
      </div>
    </>
  )
}
