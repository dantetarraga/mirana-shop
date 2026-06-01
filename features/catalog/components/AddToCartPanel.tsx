'use client'

import { Button } from '@/shared/components/ui/Button'
import { useStore } from '@/shared/lib/store-context'
import type { CatalogProduct } from '@/shared/types/catalog.types'
import { Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface Props {
  product: CatalogProduct
}

export function AddToCartPanel({ product: p }: Props) {
  const { addToCart } = useStore()
  const [qty, setQty] = useState(1)
  const isOutOfStock = p.stock === 0 || p.status === 'SOLD_OUT'

  return (
    <div className="flex flex-col gap-4">
      {!isOutOfStock && (
        <div>
          <div className="text-[10px] tracking-[2px] uppercase text-muted mb-2.5">Cantidad</div>
          <div className="flex items-center border border-(--bd) w-fit">
            <Button variant="icon" size="md" onClick={() => setQty((q) => Math.max(1, q - 1))}>
              <Minus size={14} />
            </Button>
            <div className="w-13 text-center font-display text-[20px] font-extrabold border-l border-r border-(--bd) flex items-center justify-center h-10.5">
              {qty}
            </div>
            <Button variant="icon" size="md" onClick={() => setQty((q) => q + 1)}>
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
          addToCart(p, qty)
          toast.success(`"${p.name}" agregado al carrito`)
        }}
      >
        {isOutOfStock ? 'Sin stock' : `Agregar al carrito · S/ ${(p.price * qty).toFixed(2)}`}
      </Button>
    </div>
  )
}
