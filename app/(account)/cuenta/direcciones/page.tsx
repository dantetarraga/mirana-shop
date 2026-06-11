import { getMyAddresses } from '@/features/account/profile/actions/account-profile.actions'
import { AddressesSkeleton } from '@/features/account/profile/components/AddressesSkeleton'
import { DireccionesContent } from '@/features/account/profile/components/DireccionesContent'
import { getAccountUser } from '@/shared/lib/get-account-user'
import { Suspense } from 'react'

export default async function DireccionesPage() {
  const user = await getAccountUser()
  const addressesPromise = getMyAddresses(user.email)

  return (
    <Suspense fallback={<AddressesSkeleton />}>
      <DireccionesContent user={user} addressesPromise={addressesPromise} />
    </Suspense>
  )
}
