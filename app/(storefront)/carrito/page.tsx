import { CartView } from '@/features/cart/components/CartView'
import { getPricingRules } from '@/features/checkout/queries/pricing.queries'

export default async function CartPage() {
  const pricingRules = await getPricingRules()
  return <CartView pricingRules={pricingRules} />
}
