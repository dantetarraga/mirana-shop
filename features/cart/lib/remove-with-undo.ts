'use client'

import { useCartStore, type CartItem } from '@/features/cart/stores/cart.store'
import { toast } from 'sonner'

/** Cuánto queda visible el toast con "Deshacer" (ms). */
const UNDO_WINDOW_MS = 6000

/**
 * Quita una línea del carrito y ofrece deshacerlo desde el toast.
 *
 * Reemplaza al modal "¿Eliminar producto?": la confirmación previa costaba un
 * paso extra en cada borrado y el modal interrumpía el flujo; un deshacer da la
 * misma red de seguridad sin pedir permiso. Deshacer vuelve a agregar la misma
 * cantidad y forma de pago — `addToCart` reaplica el tope de stock, así que si
 * entretanto se agotó, avisa en vez de prometer unidades que ya no existen.
 */
export function removeWithUndo(line: Pick<CartItem, 'product' | 'qty' | 'preorderMode'>) {
  const { product, qty, preorderMode } = line
  useCartStore.getState().removeItem(product.id)
  toast(`"${product.name}" eliminado del carrito`, {
    duration: UNDO_WINDOW_MS,
    action: {
      label: 'Deshacer',
      onClick: () => {
        useCartStore.getState().addToCart(product, qty, preorderMode)
      },
    },
  })
}
