import { PromotionsClient } from '@/features/promotions/components/PromotionsClient'
import { getPromotions } from '@/features/promotions/queries/promotion.queries'

export const metadata = { title: 'Promociones | Mirana Admin' }

export default async function PromotionsPage() {
  const promotions = await getPromotions()
  return <PromotionsClient promotions={promotions} />
}
