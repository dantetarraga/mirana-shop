import { CartHydrator } from '@/features/cart/components/CartHydrator'
import { StoreOverlays } from '@/features/cart/components/StoreOverlays'
import { getCartState } from '@/features/cart/queries/cart.queries'
import { getPricingRules } from '@/features/checkout/queries/pricing.queries'
import { PromoAnnouncementBar } from '@/features/home/components/PromoAnnouncementBar'
import { getStoreSettings } from '@/features/settings/queries/store-settings.queries'
import { Footer } from '@/shared/components/layout/Footer'
import { Navbar } from '@/shared/components/layout/Navbar'
import { WhatsAppFloat } from '@/shared/components/layout/WhatsAppFloat'

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const [cartState, pricingRules, settings] = await Promise.all([
    getCartState(),
    getPricingRules(),
    getStoreSettings(),
  ])

  return (
    <>
      {/* Barra de promociones activas — fixed top-0, empuja el navbar hacia abajo */}
      <PromoAnnouncementBar />
      <CartHydrator initialCart={cartState.items} expired={cartState.expired} />
      <Navbar logoUrl={settings.footerLogoUrl || '/logo.svg'} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <StoreOverlays pricingRules={pricingRules} />
      <WhatsAppFloat />
    </>
  )
}
