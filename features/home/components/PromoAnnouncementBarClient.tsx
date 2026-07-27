'use client'

import type { PromoBarItem } from '@/features/promotions/queries/promo-bar.queries'
import { Gift, Tag, Truck, X } from 'lucide-react'
import { useEffect, useState } from 'react'

const ICONS = {
  free_shipping: Truck,
  discount: Tag,
  coupon: Gift,
} as const

const STORAGE_KEY = 'mirana-promo-bar-v1'
const BAR_HEIGHT = '2.25rem' // h-9 = 36px

interface Props {
  items: PromoBarItem[]
}

export function PromoAnnouncementBarClient({ items }: Props) {
  const [visible, setVisible] = useState(true)

  // Al montar: confirma que --ab esté seteado; si fue cerrado antes, bájalo
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(STORAGE_KEY)) {
      setVisible(false)
      document.documentElement.style.setProperty('--ab', '0px')
    } else {
      document.documentElement.style.setProperty('--ab', BAR_HEIGHT)
    }
  }, [])

  const dismiss = () => {
    setVisible(false)
    localStorage.setItem(STORAGE_KEY, '1')
    document.documentElement.style.setProperty('--ab', '0px')
  }

  if (!visible) return null

  const doubled = [...items, ...items]

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[500] h-9 bg-emerald-600 text-white flex items-center overflow-hidden"
      role="banner"
      aria-label="Promociones activas"
    >
      {/* Marquee */}
      <div className="flex-1 overflow-hidden">
        <div className="animate-marquee flex whitespace-nowrap">
          {doubled.map((item, i) => {
            const Icon = ICONS[item.kind]
            const isCoupon = item.kind === 'coupon'
            return (
              <span
                key={i}
                className="shrink-0 inline-flex items-center gap-2 px-8 font-display text-[11px] sm:text-[12px] font-bold tracking-[1.5px] uppercase"
              >
                <Icon size={12} aria-hidden className="text-white/80 shrink-0" />
                {isCoupon ? (
                  <>
                    Cupón{' '}
                    <span className="bg-white text-emerald-700 px-1.5 py-0.5 text-[10px] font-mono tracking-[1px] font-bold rounded-none">
                      {item.code}
                    </span>{' '}
                    — {item.text}
                  </>
                ) : (
                  item.text
                )}
                <span aria-hidden className="opacity-30 text-[8px] mx-2">
                  ◆
                </span>
              </span>
            )
          })}
        </div>
      </div>

      {/* Botón cerrar */}
      <button
        onClick={dismiss}
        aria-label="Cerrar barra de promociones"
        className="shrink-0 flex items-center justify-center w-9 h-9 text-white/60 hover:text-white transition-colors duration-150"
      >
        <X size={14} />
      </button>
    </div>
  )
}
