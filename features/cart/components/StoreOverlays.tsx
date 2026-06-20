'use client'

import { AuthModal } from '@/features/auth/components/AuthModal'
import { ProductModal } from '@/features/products/components/ProductModal'
import { CartDrawer } from './CartDrawer'

export function StoreOverlays() {
  return (
    <>
      <CartDrawer />
      <ProductModal />
      <AuthModal />
    </>
  )
}
