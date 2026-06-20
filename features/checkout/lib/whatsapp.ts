import { formatCurrency } from '@/shared/lib/utils'
import type { SuccessData } from '../types'

// ---------------------------------------------------------------------------
// WhatsApp — flujo de pago manual
//
// El cliente confirma su pedido (queda "Pendiente de comprobante" en BD) y
// luego envía el comprobante de pago por WhatsApp junto con su código de
// pedido. Un admin valida el pago y acepta la orden manualmente.
// ---------------------------------------------------------------------------

/** Número en formato E.164 sin "+" (ej: "51987654321"), usado en el enlace wa.me. */
export const WHATSAPP_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? ''

/** Número formateado para mostrar al usuario (ej: "+51 987 654 321"). */
export const WHATSAPP_PHONE_DISPLAY = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_DISPLAY ?? ''

function buildOrderMessage(data: SuccessData): string {
  const lines = [
    `Hola, quiero confirmar mi pedido *${data.code}*.`,
    '',
    ...data.items.map(
      (item) => `• ${item.qty}x ${item.name} — ${formatCurrency(item.unitPrice * item.qty)}`,
    ),
    '',
    `Subtotal: ${formatCurrency(data.subtotal)}`,
    `Envío: ${data.shippingCost === 0 ? 'Gratis' : formatCurrency(data.shippingCost)}`,
    `Total: ${formatCurrency(data.total)}`,
    '',
    'Adjunto mi comprobante de pago.',
  ]
  return lines.join('\n')
}

/** Construye el enlace de WhatsApp con el mensaje predeterminado de la compra. */
export function buildWhatsappOrderUrl(data: SuccessData): string {
  const text = encodeURIComponent(buildOrderMessage(data))
  return `https://wa.me/${WHATSAPP_PHONE}?text=${text}`
}
