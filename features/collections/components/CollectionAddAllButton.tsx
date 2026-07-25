'use client'

import { useCartStore } from '@/features/cart/stores/cart.store'
import { effectivePrice } from '@/features/checkout/lib/pricing'
import { remainingStock } from '@/features/products/lib/stock'
import type { CatalogProduct } from '@/features/products/types/catalog.types'
import { Button } from '@/shared/components/ui/Button'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// CTA de la ficha de colección — el equivalente de AddToCartPanel en un
// producto: mismo botón grande a todo el ancho con el total al lado.
//
// Mete una unidad de cada producto disponible. Los agotados y los que ya están
// al tope se saltan y se resumen en un solo aviso (nunca se dice cuántas
// unidades quedan, igual que en el resto del sitio).
// ---------------------------------------------------------------------------

interface CollectionAddAllButtonProps {
  products: CatalogProduct[]
  collectionName: string
}

export function CollectionAddAllButton({ products, collectionName }: CollectionAddAllButtonProps) {
  const { cart, addManyToCart } = useCartStore()

  // Lo que realmente entraría ahora mismo — el mismo criterio que aplica
  // addManyToCart, para que el total del botón no prometa de más.
  const addable = products.filter((p) => {
    const inCart = cart.find((i) => i.product.id === p.id)?.qty ?? 0
    const remaining = remainingStock(p, inCart)
    return remaining === null || remaining > 0
  })
  const total = addable.reduce((sum, p) => sum + effectivePrice(p), 0)

  const isEmpty = products.length === 0
  const allInCart = !isEmpty && addable.length === 0

  const handleClick = () => {
    const { added, skipped } = addManyToCart(products)

    if (added === 0) {
      toast.warning(`No hay nada disponible para agregar de "${collectionName}"`)
      return
    }

    toast.success(`${added} producto${added !== 1 ? 's' : ''} de "${collectionName}" en el carrito`)
    if (skipped.length > 0) {
      toast.warning(
        `${skipped.length} producto${skipped.length !== 1 ? 's' : ''} sin disponibilidad: ${skipped.join(', ')}`,
      )
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="text-[10px] tracking-[2px] uppercase text-muted mb-2.5">Set completo</div>
        <p className="text-[13px] text-muted leading-relaxed max-w-120">
          Agrega una unidad de cada producto disponible de la colección. También puedes elegirlos
          uno a uno más abajo.
        </p>
      </div>

      <Button
        variant="accent"
        size="lg"
        full
        disabled={isEmpty || allInCart}
        onClick={handleClick}
      >
        {isEmpty
          ? 'Sin productos disponibles'
          : allInCart
            ? 'Ya está todo en el carrito'
            : `Agregar todo · S/ ${total.toFixed(2)}`}
      </Button>
    </div>
  )
}
