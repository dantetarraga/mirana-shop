import { StoreSettingsClient } from '@/features/settings/components/StoreSettingsClient'
import { getAllPaymentAccounts } from '@/features/settings/queries/payment-accounts.queries'
import { getStoreSettings } from '@/features/settings/queries/store-settings.queries'
import { verifyAdmin } from '@/shared/lib/require-admin'

export const metadata = { title: 'Configuración — Admin' }

export default async function AdminSettingsPage() {
  await verifyAdmin()
  const [settings, accounts] = await Promise.all([getStoreSettings(), getAllPaymentAccounts()])
  return <StoreSettingsClient initial={settings} initialAccounts={accounts} />
}
