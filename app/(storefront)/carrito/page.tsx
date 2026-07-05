import { CartView } from '@/features/cart/components/CartView'
import { getPricingRules } from '@/features/checkout/queries/pricing.queries'
import type { Metadata } from 'next'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function CartPage() {
  const pricingRules = await getPricingRules()
  return <CartView pricingRules={pricingRules} />
}
