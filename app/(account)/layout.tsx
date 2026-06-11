import { Footer } from '@/shared/components/layout/Footer'
import { Navbar } from '@/shared/components/layout/Navbar'
import { StoreOverlays } from '@/shared/components/StoreOverlays'
import { StoreProvider } from '@/shared/lib/store-context'

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <StoreOverlays />
    </StoreProvider>
  )
}
