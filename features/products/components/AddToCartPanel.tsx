'use client'

import { useCartStore } from '@/features/cart/stores/cart.store'
import { effectivePrice } from '@/features/checkout/lib/pricing'
import { remainingStock, stockLimitMessage } from '@/features/products/lib/stock'
import type { CatalogProduct } from '@/features/products/types/catalog.types'
import { Button } from '@/shared/components/ui/Button'
import { Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface Props {
  product: CatalogProduct
}

export function AddToCartPanel({ product: p }: Props) {
  const { cart, addToCart } = useCartStore()
  const [qty, setQty] = useState(1)
  const isOutOfStock = p.stock === 0 || p.status === 'SOLD_OUT'
  const unitPrice = effectivePrice(p)

  // El tope descuenta lo que ya está en el carrito: con 2 en stock y 1 ya
  // agregado, aquí solo se puede elegir 1 más.
  const inCart = cart.find((i) => i.product.id === p.id)?.qty ?? 0
  const remaining = remainingStock(p, inCart)
  const atLimit = remaining !== null && qty >= remaining

  const increase = () => {
    if (atLimit) {
      toast.warning(stockLimitMessage(p.name))
      return
    }
    setQty((q) => q + 1)
  }

  return (
    <div className="flex flex-col gap-4">
      {!isOutOfStock && (
        <div>
          <div className="text-[10px] tracking-[2px] uppercase text-muted mb-2.5">Cantidad</div>
          <div className="flex items-center border border-(--bd) w-fit">
            <Button
              variant="icon"
              size="md"
              aria-label="Quitar una unidad"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              <Minus size={14} />
            </Button>
            <div className="w-13 text-center font-display text-[20px] font-extrabold border-l border-r border-(--bd) flex items-center justify-center h-10.5">
              {qty}
            </div>
            <Button variant="icon" size="md" aria-label="Agregar una unidad" onClick={increase}>
              <Plus size={14} />
            </Button>
          </div>
        </div>
      )}

      <Button
        variant="accent"
        size="lg"
        full
        disabled={isOutOfStock}
        onClick={() => {
          // El store vuelve a aplicar el tope y avisa si ya no cabe nada.
          if (addToCart(p, qty) > 0) toast.success(`"${p.name}" agregado al carrito`)
        }}
      >
        {isOutOfStock ? 'Sin stock' : `Agregar al carrito · S/ ${(unitPrice * qty).toFixed(2)}`}
      </Button>
    </div>
  )
}
