import { Footer } from '@/shared/components/layout/Footer'
import { Navbar } from '@/shared/components/layout/Navbar'
import { SessionSync } from '@/shared/components/SessionSync'
import { StoreOverlays } from '@/shared/components/StoreOverlays'
import { StoreProvider } from '@/shared/lib/store-context'
import { Suspense } from 'react'

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <StoreOverlays />
      <Suspense>
        <SessionSync />
      </Suspense>
    </StoreProvider>
  )
}
