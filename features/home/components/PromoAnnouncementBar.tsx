import { PROMO_BAR_COOKIE } from '@/features/home/lib/promo-bar-cookie'
import { getPromoBarItems } from '@/features/promotions/queries/promo-bar.queries'
import { cookies } from 'next/headers'
import { PromoAnnouncementBarClient } from './PromoAnnouncementBarClient'

export async function PromoAnnouncementBar() {
  const [items, cookieStore] = await Promise.all([getPromoBarItems(), cookies()])
  // Cerrada por el visitante: ni barra ni hueco (--ab queda en 0 del :root).
  if (items.length === 0 || cookieStore.get(PROMO_BAR_COOKIE)?.value === '1') return null

  return (
    <>
      {/*
        Setea --ab en el SSR para que el navbar y el contenido ya nazcan
        con el offset correcto, sin esperar a la hidratación del cliente.
      */}
      <style dangerouslySetInnerHTML={{ __html: ':root { --ab: 2.25rem; }' }} />
      <PromoAnnouncementBarClient items={items} />
    </>
  )
}
