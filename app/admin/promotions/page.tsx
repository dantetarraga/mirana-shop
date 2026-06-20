import { PromotionsClient } from '@/features/promotions/components/PromotionsClient'
import { promotionRepo } from '@/features/promotions/services/promotion.service'

export const metadata = { title: 'Promociones | Mirana Admin' }

export default async function PromotionsPage() {
  const promotions = await promotionRepo.findAll()
  return <PromotionsClient promotions={promotions} />
}
