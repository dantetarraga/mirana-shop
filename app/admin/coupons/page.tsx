import { CouponsClient } from '@/features/coupons/components/CouponsClient'
import { getCoupons, getPromotionOptions } from '@/features/coupons/queries/coupon.queries'

export const metadata = { title: 'Cupones | Mirana Admin' }

export default async function AdminCouponsPage() {
  const [coupons, promotions] = await Promise.all([getCoupons(), getPromotionOptions()])
  return <CouponsClient coupons={coupons} promotions={promotions} />
}
