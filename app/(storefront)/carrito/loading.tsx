import { CartSkeleton } from '@/features/cart/components/CartSkeleton'

// ↔ CartView — el esqueleto vive junto a la vista y CartView lo reutiliza
// mientras se hidrata el carrito.
export default function CartLoading() {
  return <CartSkeleton />
}
