import { getPromoBarItems } from '@/features/promotions/queries/promo-bar.queries'
import { PromoAnnouncementBarClient } from './PromoAnnouncementBarClient'

export async function PromoAnnouncementBar() {
  const items = await getPromoBarItems()
  if (items.length === 0) return null

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
