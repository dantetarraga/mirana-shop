'use client'

import { useCartStore } from '@/features/cart/stores/cart.store'
import type { CartLine } from '@/features/cart/types'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

/** Identidad del contenido del carrito, para no re-sembrar por un array nuevo. */
function signature(items: CartLine[]): string {
  return items.map((i) => `${i.product.id}:${i.qty}`).join('|')
}

interface Props {
  initialCart: CartLine[]
  /** El carrito guardado había caducado y se muestra vacío. */
  expired?: boolean
}

/** Siembra el carrito (leído en servidor) en el store al montar el layout. */
export function CartHydrator({ initialCart, expired = false }: Props) {
  // `initialCart` es un array nuevo en cada render del layout, así que un
  // efecto dependiente de su identidad se re-disparaba con cualquier
  // router.refresh()/revalidatePath y pisaba escrituras en vuelo. Se compara el
  // contenido en su lugar.
  const lastSignature = useRef<string | null>(null)

  useEffect(() => {
    const sig = signature(initialCart)
    if (lastSignature.current === sig) return
    lastSignature.current = sig
    useCartStore.getState().hydrateCart(initialCart)
  }, [initialCart])

  const warned = useRef(false)
  useEffect(() => {
    if (!expired || warned.current) return
    warned.current = true
    toast.info('Tu carrito caducó y se vació. Vuelve a agregar los productos que quieras.')
  }, [expired])

  return null
}
