import { CartHydrator } from '@/features/cart/components/CartHydrator'
import { StoreOverlays } from '@/features/cart/components/StoreOverlays'
import { getCart } from '@/features/cart/queries/cart.queries'
import { getPricingRules } from '@/features/checkout/queries/pricing.queries'
import { Footer } from '@/shared/components/layout/Footer'
import { Navbar } from '@/shared/components/layout/Navbar'
import { WhatsAppFloat } from '@/shared/components/layout/WhatsAppFloat'

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const [initialCart, pricingRules] = await Promise.all([getCart(), getPricingRules()])

  return (
    <>
      <CartHydrator initialCart={initialCart} />
      <Navbar />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <StoreOverlays pricingRules={pricingRules} />
      <WhatsAppFloat />
    </>
  )
}
