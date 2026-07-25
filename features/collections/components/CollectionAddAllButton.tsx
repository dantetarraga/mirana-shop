'use client'

import { useCartStore } from '@/features/cart/stores/cart.store'
import type { CatalogProduct } from '@/features/products/types/catalog.types'
import { Button } from '@/shared/components/ui/Button'
import { ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// "Agregar todo" — mete una unidad de cada producto de la colección al carrito.
// Los agotados y los que ya están al tope se saltan y se resumen en un solo
// aviso (nunca se dice cuántas unidades quedan, igual que en el resto del sitio).
// ---------------------------------------------------------------------------

interface CollectionAddAllButtonProps {
  products: CatalogProduct[]
  collectionName: string
}

export function CollectionAddAllButton({ products, collectionName }: CollectionAddAllButtonProps) {
  const { addManyToCart } = useCartStore()

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
    <Button variant="accent" size="md" onClick={handleClick} disabled={products.length === 0}>
      <ShoppingCart size={15} />
      Agregar todo al carrito
    </Button>
  )
}
