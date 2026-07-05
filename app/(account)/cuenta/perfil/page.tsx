import { getMyOrders } from '@/features/orders/actions/account-orders.actions'
import { getMyProfile } from '@/features/profile/actions/account-profile.actions'
import { PerfilContent } from '@/features/profile/components/PerfilContent'
import { ProfileSkeleton } from '@/features/profile/components/ProfileSkeleton'
import { getAccountUser } from '@/shared/lib/get-account-user'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function PerfilPage() {
  const user = await getAccountUser()
  const profilePromise = getMyProfile(user.email)
  const ordersPromise = getMyOrders(user.email)

  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <PerfilContent user={user} profilePromise={profilePromise} ordersPromise={ordersPromise} />
    </Suspense>
  )
}
