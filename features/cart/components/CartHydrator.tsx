'use client'

import { useCartStore } from '@/features/cart/stores/cart.store'
import type { CartLine } from '@/features/cart/types'
import { useEffect } from 'react'

/** Siembra el carrito (leído en servidor) en el store al montar el layout. */
export function CartHydrator({ initialCart }: { initialCart: CartLine[] }) {
  useEffect(() => {
    useCartStore.getState().hydrateCart(initialCart)
  }, [initialCart])

  return null
}
