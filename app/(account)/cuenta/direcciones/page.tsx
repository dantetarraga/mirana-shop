import { getMyAddresses } from '@/features/profile/actions/account-profile.actions'
import { AddressesSkeleton } from '@/features/profile/components/AddressesSkeleton'
import { DireccionesContent } from '@/features/profile/components/DireccionesContent'
import { getAccountUser } from '@/shared/lib/get-account-user'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function DireccionesPage() {
  await getAccountUser()
  const addressesPromise = getMyAddresses()

  return (
    <Suspense fallback={<AddressesSkeleton />}>
      <DireccionesContent addressesPromise={addressesPromise} />
    </Suspense>
  )
}
