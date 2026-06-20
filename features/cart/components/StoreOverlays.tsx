'use client'

import { AuthModal } from './AuthModal'
import { CartDrawer } from './CartDrawer'
import { ProductModal } from './ProductModal'

export function StoreOverlays() {
  return (
    <>
      <CartDrawer />
      <ProductModal />
      <AuthModal />
    </>
  )
}
