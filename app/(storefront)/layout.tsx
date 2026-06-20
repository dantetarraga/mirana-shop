import { CartHydrator } from '@/features/cart/components/CartHydrator'
import { StoreOverlays } from '@/features/cart/components/StoreOverlays'
import { getCart } from '@/features/cart/queries/cart.queries'
import { Footer } from '@/shared/components/layout/Footer'
import { Navbar } from '@/shared/components/layout/Navbar'

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const initialCart = await getCart()

  return (
    <>
      <CartHydrator initialCart={initialCart} />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <StoreOverlays />
    </>
  )
}
