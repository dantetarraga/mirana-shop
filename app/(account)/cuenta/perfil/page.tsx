import { getMyOrders } from '@/features/account/orders/actions/account.actions'
import { getMyProfile } from '@/features/account/profile/actions/account-profile.actions'
import { PerfilContent } from '@/features/account/profile/components/PerfilContent'
import { ProfileSkeleton } from '@/features/account/profile/components/ProfileSkeleton'
import { getAccountUser } from '@/shared/lib/get-account-user'
import { Suspense } from 'react'

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
