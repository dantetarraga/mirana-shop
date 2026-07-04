'use client'

import { AuthModal } from '@/features/auth/components/AuthModal'
import type { PricingRules } from '@/features/checkout/lib/pricing'
import { ProductModal } from '@/features/products/components/ProductModal'
import { CartDrawer } from './CartDrawer'

interface StoreOverlaysProps {
  pricingRules: PricingRules
}

export function StoreOverlays({ pricingRules }: StoreOverlaysProps) {
  return (
    <>
      <CartDrawer pricingRules={pricingRules} />
      <ProductModal />
      <AuthModal />
    </>
  )
}
