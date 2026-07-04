import { CheckoutView } from '@/features/checkout/components/CheckoutView'
import { getActivePaymentAccounts } from '@/features/settings/queries/payment-accounts.queries'
import { getWhatsappPhone } from '@/features/settings/queries/store-settings.queries'

export default async function CheckoutPage() {
  const [paymentAccounts, whatsappPhone] = await Promise.all([
    getActivePaymentAccounts(),
    getWhatsappPhone(),
  ])

  return <CheckoutView paymentAccounts={paymentAccounts} whatsappPhone={whatsappPhone} />
}
