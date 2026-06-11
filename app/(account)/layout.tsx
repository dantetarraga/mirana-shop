import { Footer } from '@/shared/components/layout/Footer'
import { Navbar } from '@/shared/components/layout/Navbar'
import { StoreOverlays } from '@/shared/components/StoreOverlays'
import { getAccountUser } from '@/shared/lib/get-account-user'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await getAccountUser()

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <StoreOverlays />
    </>
  )
}
