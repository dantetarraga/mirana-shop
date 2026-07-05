import { getMyAddresses } from '@/features/profile/actions/account-profile.actions'
import { AddressesSkeleton } from '@/features/profile/components/AddressesSkeleton'
import { DireccionesContent } from '@/features/profile/components/DireccionesContent'
import { getAccountUser } from '@/shared/lib/get-account-user'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function DireccionesPage() {
  const user = await getAccountUser()
  const addressesPromise = getMyAddresses(user.email)

  return (
    <Suspense fallback={<AddressesSkeleton />}>
      <DireccionesContent user={user} addressesPromise={addressesPromise} />
    </Suspense>
  )
}
