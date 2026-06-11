import { Footer } from '@/shared/components/layout/Footer'
import { Navbar } from '@/shared/components/layout/Navbar'
import { StoreOverlays } from '@/shared/components/StoreOverlays'

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <StoreOverlays />
    </>
  )
}
