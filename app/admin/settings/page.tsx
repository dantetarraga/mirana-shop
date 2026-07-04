import { StoreSettingsClient } from '@/features/settings/components/StoreSettingsClient'
import { getAllPaymentAccounts } from '@/features/settings/queries/payment-accounts.queries'
import { getStoreSettings } from '@/features/settings/queries/store-settings.queries'

export const metadata = { title: 'Configuración — Admin' }

export default async function AdminSettingsPage() {
  const [settings, accounts] = await Promise.all([getStoreSettings(), getAllPaymentAccounts()])
  return <StoreSettingsClient initial={settings} initialAccounts={accounts} />
}
