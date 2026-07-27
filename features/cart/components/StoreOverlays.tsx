'use client'

import { AuthModal } from '@/features/auth/components/AuthModal'
import type { PricingRules } from '@/features/checkout/lib/pricing'
import { ProductModal } from '@/features/products/components/ProductModal'
import { CartDrawer } from './CartDrawer'
import { CartMixModal } from './CartMixModal'

interface StoreOverlaysProps {
  pricingRules: PricingRules
}

export function StoreOverlays({ pricingRules }: StoreOverlaysProps) {
  return (
    <>
      <CartDrawer pricingRules={pricingRules} />
      {/* Va después del drawer: se abre encima de él cuando el choque se
          dispara desde un botón de la ficha con el carrito abierto. */}
      <CartMixModal />
      <ProductModal defaultDepositPercent={pricingRules.preorderDepositPercent} />
      <AuthModal />
    </>
  )
}
