import { Footer } from '@/shared/components/layout/Footer'
import { Navbar } from '@/shared/components/layout/Navbar'
import { WhatsAppFloat } from '@/shared/components/layout/WhatsAppFloat'
import { StoreOverlays } from '@/features/cart/components/StoreOverlays'
import { getPricingRules } from '@/features/checkout/queries/pricing.queries'
import { getAccountUser } from '@/shared/lib/get-account-user'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const [, pricingRules] = await Promise.all([getAccountUser(), getPricingRules()])

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <StoreOverlays pricingRules={pricingRules} />
      <WhatsAppFloat />
    </>
  )
}
