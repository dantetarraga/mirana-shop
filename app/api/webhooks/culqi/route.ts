import { db } from '@/shared/lib/db'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Webhook de Culqi — recibe eventos de pago y actualiza el estado de la orden.
 * Docs: https://docs.culqi.com/es/documentacion/pagos-online/webhooks
 *
 * Configura este endpoint en el Panel Culqi:
 *   URL: https://tu-dominio.com/api/webhooks/culqi
 *   Eventos: charge.paid, order.paid
 */

// ---------------------------------------------------------------------------
// Tipos de payload de Culqi (subset necesario)
// ---------------------------------------------------------------------------

type CulqiWebhookPayload = {
  object: 'event'
  id: string
  type: 'charge.paid' | 'order.paid' | string
  data: {
    id: string // ID del charge u order en Culqi
    order_number?: string
    amount?: number
    currency_code?: string
    metadata?: Record<string, string>
  }
}

// ---------------------------------------------------------------------------
// POST /api/webhooks/culqi
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  // ------------------------------------------------------------------
  // 1. Verificar el token secreto del webhook (protección básica)
  // ------------------------------------------------------------------
  const webhookSecret = process.env.CULQI_WEBHOOK_SECRET
  if (webhookSecret) {
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (token !== webhookSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // ------------------------------------------------------------------
  // 2. Parsear el payload
  // ------------------------------------------------------------------
  let payload: CulqiWebhookPayload
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { type, data, id: eventId } = payload

  // ------------------------------------------------------------------
  // 3. Procesar según el tipo de evento
  // ------------------------------------------------------------------
  try {
    if (type === 'order.paid') {
      // Buscar el pago por culqiOrderId
      const payment = await db.payment.findUnique({
        where: { culqiOrderId: data.id },
        select: { id: true, orderId: true },
      })

      if (payment) {
        await db.$transaction([
          db.payment.update({
            where: { id: payment.id },
            data: {
              status: 'PAID',
              culqiEventId: eventId,
            },
          }),
          db.order.update({
            where: { id: payment.orderId },
            data: {
              status: 'PAID',
              paymentStatus: 'PAID',
              paidAt: new Date(),
            },
          }),
        ])
      }
    } else if (type === 'charge.paid') {
      // Buscar el pago por culqiChargeId
      const payment = await db.payment.findUnique({
        where: { culqiChargeId: data.id },
        select: { id: true, orderId: true },
      })

      if (payment) {
        await db.$transaction([
          db.payment.update({
            where: { id: payment.id },
            data: {
              status: 'PAID',
              culqiEventId: eventId,
            },
          }),
          db.order.update({
            where: { id: payment.orderId },
            data: {
              status: 'PAID',
              paymentStatus: 'PAID',
              paidAt: new Date(),
            },
          }),
        ])
      }
    }
    // Otros eventos (charge.failed, order.expired, etc.) se ignoran por ahora
  } catch (err) {
    console.error('[culqi-webhook] Error procesando evento:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
