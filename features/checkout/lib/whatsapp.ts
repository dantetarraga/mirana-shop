import { formatCurrency } from '@/shared/lib/utils'
import type { SuccessData } from '../types'

// ---------------------------------------------------------------------------
// WhatsApp — flujo de pago manual
//
// El cliente confirma su pedido (queda "Pendiente de comprobante" en BD) y
// luego envía el comprobante de pago por WhatsApp junto con su código de
// pedido. Un admin valida el pago y acepta la orden manualmente.
// ---------------------------------------------------------------------------

/**
 * Formatea el número para mostrar (ej: "51987654321" → "+51 987 654 321").
 * El número administrable vive en StoreSettings (getWhatsappPhone, server).
 */
export function formatPhoneDisplay(phone: string): string {
  if (!phone) return ''
  if (phone.length === 11 && phone.startsWith('51')) {
    const rest = phone.slice(2)
    return `+51 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`
  }
  return `+${phone}`
}

function buildOrderMessage(data: SuccessData): string {
  const lines = [
    `Hola, quiero confirmar mi pedido *${data.code}*.`,
    '',
    ...data.items.map(
      (item) => `• ${item.qty}x ${item.name} — ${formatCurrency(item.unitPrice * item.qty)}`,
    ),
    '',
    `Subtotal: ${formatCurrency(data.subtotal - data.dueTotal)}`,
    ...(data.discount > 0
      ? [
          `Descuento${data.couponCode ? ` (cupón ${data.couponCode})` : ''}: -${formatCurrency(data.discount)}`,
        ]
      : []),
    `${data.deliveryLabel ?? 'Envío'}: ${
      data.shippingCost === 0 ? 'Gratis' : formatCurrency(data.shippingCost)
    }`,
    // La sede queda escrita en el mensaje: es donde el cliente va a recoger.
    ...(data.deliveryLocation ? [`Retiro en: ${data.deliveryLocation}`] : []),
    `${data.dueTotal > 0 ? 'Pago hoy' : 'Total'}: ${formatCurrency(data.total)}`,
    // Que el saldo quede escrito en el mensaje evita malentendidos: el cliente
    // pagó solo el adelanto y el comprobante es por ese monto.
    ...(data.dueTotal > 0 ? [`Saldo pendiente: ${formatCurrency(data.dueTotal)}`] : []),
    '',
    'Adjunto mi comprobante de pago.',
  ]
  return lines.join('\n')
}

/** Construye el enlace de WhatsApp con el mensaje predeterminado de la compra. */
export function buildWhatsappOrderUrl(data: SuccessData, phone: string): string {
  const text = encodeURIComponent(buildOrderMessage(data))
  return `https://wa.me/${phone}?text=${text}`
}
