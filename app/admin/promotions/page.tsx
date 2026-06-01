import { PromotionsClient } from '@/features/promotions/components/PromotionsClient'
import { promotionRepo } from '@/modules/catalog/repositories/promotion.repo'

export const metadata = { title: 'Promociones | Mirana Admin' }

export default async function PromotionsPage() {
  const promotions = await promotionRepo.findAll()
  return <PromotionsClient promotions={promotions} />
}
