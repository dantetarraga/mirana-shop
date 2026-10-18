import { CheckoutAssurance } from '@/features/checkout/components/CheckoutAssurance'
import { CheckoutSkeleton } from '@/features/checkout/components/CheckoutSkeleton'
import { orderReservationTtlMinutes } from '@/features/orders/lib/reservation'

// ↔ CheckoutView en el paso "Tus datos". El esqueleto vive junto a la vista
// (CheckoutSkeleton) y comparte con ella las clases de rejilla y medidas
// (checkout-layout.ts); CheckoutView lo reutiliza mientras se hidrata el
// carrito. Sin datos aquí, asume 3 pasos (con formas de entrega) y 2 líneas.
export default function CheckoutLoading() {
  return <CheckoutSkeleton assurance={<CheckoutAssurance reservationMinutes={orderReservationTtlMinutes()} />} />
}
