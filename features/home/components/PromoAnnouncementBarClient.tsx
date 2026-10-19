'use client'

import type { PromoBarItem } from '@/features/promotions/queries/promo-bar.queries'
import { PROMO_BAR_COOKIE, PROMO_BAR_COOKIE_MAX_AGE } from '@/features/home/lib/promo-bar-cookie'
import { Gift, Tag, Truck, X } from 'lucide-react'
import { useEffect, useState } from 'react'

const ICONS = {
  free_shipping: Truck,
  discount: Tag,
  coupon: Gift,
} as const

/** Clave de la versión anterior (localStorage); se migra a la cookie. */
const LEGACY_STORAGE_KEY = 'mirana-promo-bar-v1'

interface Props {
  items: PromoBarItem[]
}

export function PromoAnnouncementBarClient({ items }: Props) {
  const [hidden, setHidden] = useState(false)

  const dismiss = () => {
    // La cookie la lee el servidor en la próxima carga; aquí se oculta ya y se
    // quita el alto reservado (--ab) que dejó el <style> del SSR.
    document.cookie = `${PROMO_BAR_COOKIE}=1; path=/; max-age=${PROMO_BAR_COOKIE_MAX_AGE}; samesite=lax`
    document.documentElement.style.setProperty('--ab', '0px')
    setHidden(true)
  }

  // Quien la cerró con la versión anterior (localStorage) no debe volver a
  // verla: se pasa a la cookie y se oculta (solo ocurre una vez por visitante).
  useEffect(() => {
    try {
      if (localStorage.getItem(LEGACY_STORAGE_KEY) === '1') {
        localStorage.removeItem(LEGACY_STORAGE_KEY)
        // eslint-disable-next-line react-hooks/set-state-in-effect -- migración única desde localStorage
        dismiss()
      }
    } catch {
      // Almacenamiento bloqueado: nada que migrar.
    }
  }, [])

  if (hidden) return null

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
