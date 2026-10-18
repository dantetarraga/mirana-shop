import { Clock, Landmark, Truck } from 'lucide-react'
import { formatReservation } from './checkout-layout'

// ---------------------------------------------------------------------------
// "Cómo funciona tu compra" — junto al CTA, lo que el cliente necesita saber
// antes de confirmar. Todo describe el flujo real:
//   - el pedido se crea sin cobro (AWAITING_PROOF) y se paga por transferencia
//     o depósito, enviando el comprobante por WhatsApp (SuccessScreen);
//   - placeOrder reserva el stock `reservationMinutes` (ORDER_RESERVATION_TTL_
//     MINUTES) y el cron cancela el pedido si no llega el comprobante;
//   - el costo de entrega sale de la forma elegida.
//
// Sin estado ni 'use client': lo pinta también el esqueleto de carga, así que
// mide exactamente lo mismo y no hay salto.
// ---------------------------------------------------------------------------

type Props = {
  /** Minutos que se aparta el stock tras confirmar */
  reservationMinutes: number
  /** La tienda configuró un número de WhatsApp para recibir comprobantes */
  hasWhatsapp?: boolean
  /** Hay formas de entrega para elegir (si no, se cobra el envío base) */
  hasDeliveryChoice?: boolean
  className?: string
}

export function CheckoutAssurance({
  reservationMinutes,
  hasWhatsapp = true,
  hasDeliveryChoice = true,
  className,
}: Props) {
  const items = [
    {
      icon: Landmark,
      text: hasWhatsapp
        ? 'No cobramos nada al confirmar. Pagas por transferencia o depósito y nos envías el comprobante por WhatsApp.'
        : 'No cobramos nada al confirmar. Pagas por transferencia o depósito y nos envías el comprobante.',
    },
    {
      icon: Clock,
      text: `Apartamos tus productos por ${formatReservation(reservationMinutes)}. Si no recibimos el comprobante en ese plazo, el pedido se cancela.`,
    },
    {
      icon: Truck,
      text: hasDeliveryChoice
        ? 'El costo de entrega depende de la forma que elijas y ya figura en el total.'
        : 'El costo de envío ya está sumado al total del resumen, sin cargos aparte.',
    },
  ]

  return (
    <section aria-labelledby="checkout-assurance-title" className={className}>
      <h2 id="checkout-assurance-title" className="font-sans text-[14px] leading-5 font-semibold text-text">
        Cómo funciona tu compra
      </h2>
      <ul className="mt-3 flex flex-col gap-3">
        {items.map(({ icon: Icon, text }) => (
          <li key={text} className="flex gap-3 text-[13px] leading-5 text-muted">
            <Icon size={16} className="mt-0.5 shrink-0 text-accent-ink" aria-hidden />
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
