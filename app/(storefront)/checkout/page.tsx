import { CheckoutView } from '@/features/checkout/components/CheckoutView'
import { getPricingRules } from '@/features/checkout/queries/pricing.queries'
import { getMyAddresses, getMyProfile } from '@/features/profile/actions/account-profile.actions'
import { getActivePaymentAccounts } from '@/features/settings/queries/payment-accounts.queries'
import { getWhatsappPhone } from '@/features/settings/queries/store-settings.queries'
import type { Metadata } from 'next'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function CheckoutPage() {
  // Perfil y direcciones salen del servidor junto con el resto, en paralelo.
  // Antes CheckoutView los pedía en dos useEffect después de hidratar: el
  // formulario se pintaba vacío y saltaba al rellenarse (y el DNI llegaba tarde).
  // Ambas derivan el usuario de la sesión (requireUser) y sin sesión devuelven
  // null / [] sin tocar la BD más allá del guard.
  const [paymentAccounts, whatsappPhone, pricingRules, profile, addresses] = await Promise.all([
    getActivePaymentAccounts(),
    getWhatsappPhone(),
    getPricingRules(),
    getMyProfile(),
    getMyAddresses(),
  ])

  return (
    <CheckoutView
      paymentAccounts={paymentAccounts}
      whatsappPhone={whatsappPhone}
      pricingRules={pricingRules}
      initialProfile={profile}
      initialAddresses={addresses}
    />
  )
}
