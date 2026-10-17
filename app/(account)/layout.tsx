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
import { getAccountUser } from '@/shared/lib/get-account-user'

// ---------------------------------------------------------------------------
// Mismo "chrome" que el layout de la tienda: barra de promociones, navbar con
// el logo configurado y el carrito hidratado. Antes faltaba CartHydrator, así
// que entrar a /cuenta con el carrito lleno mostraba el contador en cero hasta
// volver a la tienda.
// ---------------------------------------------------------------------------

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  // getAccountUser redirige al inicio si no hay sesión; va en paralelo con el
  // resto porque ninguna otra lectura depende de él.
  const [, cartState, pricingRules, settings, nav] = await Promise.all([
    getAccountUser(),
    getCartState(),
    getPricingRules(),
    getStoreSettings(),
    getNavLinks(),
  ])

  return (
    <>
      <PromoAnnouncementBar />
      <CartHydrator initialCart={cartState.items} expired={cartState.expired} />
      <Navbar
        logoUrl={settings.footerLogoUrl || '/logo.svg'}
        categories={nav.categories}
        collections={nav.collections}
      />
      {/* Las páginas de cuenta reservan el alto del navbar en su propio
          contenedor (pt-[calc(var(--nh)+48px)]), por eso aquí no va pt-(--nh). */}
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <StoreOverlays pricingRules={pricingRules} />
      <WhatsAppFloat />
    </>
  )
}
