import { CartHydrator } from '@/features/cart/components/CartHydrator'
import { StoreOverlays } from '@/features/cart/components/StoreOverlays'
import { getCartState } from '@/features/cart/queries/cart.queries'
import { getPricingRules } from '@/features/checkout/queries/pricing.queries'
import { getNavLinks } from '@/features/layout/queries/nav-links.queries'
import { PromoAnnouncementBar } from '@/features/home/components/PromoAnnouncementBar'
import { getStoreSettings } from '@/features/settings/queries/store-settings.queries'
import { Footer } from '@/shared/components/layout/Footer'
import { Navbar } from '@/shared/components/layout/Navbar'
import { WhatsAppFloat } from '@/shared/components/layout/WhatsAppFloat'

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const [cartState, pricingRules, settings, nav] = await Promise.all([
    getCartState(),
    getPricingRules(),
    getStoreSettings(),
    getNavLinks(),
  ])

  return (
    <>
      {/* Barra de promociones activas — fixed top-0, empuja el navbar hacia abajo */}
      <PromoAnnouncementBar />
      <CartHydrator initialCart={cartState.items} expired={cartState.expired} />
      <Navbar
        logoUrl={settings.footerLogoUrl || undefined}
        nav={nav}
      />
      {/* El navbar es `fixed`: su alto (+ la barra de promos) se reserva UNA vez
          aquí. Antes cada página sumaba su propio `pt-(--nh)` y las que lo
          olvidaban (ficha, colección) quedaban con el breadcrumb tapado. */}
      <main id="main" className="flex-1 pt-(--nh)">
        {children}
      </main>
      <Footer />
      <StoreOverlays pricingRules={pricingRules} />
      <WhatsAppFloat />
    </>
  )
}
