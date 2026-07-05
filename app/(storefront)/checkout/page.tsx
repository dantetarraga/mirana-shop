import { CheckoutView } from '@/features/checkout/components/CheckoutView'
import { getPricingRules } from '@/features/checkout/queries/pricing.queries'
import { getActivePaymentAccounts } from '@/features/settings/queries/payment-accounts.queries'
import { getWhatsappPhone } from '@/features/settings/queries/store-settings.queries'
import type { Metadata } from 'next'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function CheckoutPage() {
  const [paymentAccounts, whatsappPhone, pricingRules] = await Promise.all([
    getActivePaymentAccounts(),
    getWhatsappPhone(),
    getPricingRules(),
  ])

  return (
    <CheckoutView
      paymentAccounts={paymentAccounts}
      whatsappPhone={whatsappPhone}
      pricingRules={pricingRules}
    />
  )
}
