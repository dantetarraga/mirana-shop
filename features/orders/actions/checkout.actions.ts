'use server'

import type { PaymentMethod } from '@/generated/prisma/client'
import { orderRepo } from '@/modules/orders/repositories/order.repo'
import {
  createCulqiCharge,
  createCulqiOrder,
  culqiExpiration,
  toCulqiAmount,
} from '@/shared/lib/culqi'
import { checkoutSchema } from '@/shared/lib/schemas'
import { revalidatePath } from 'next/cache'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type CartItemForOrder = {
  productId: string
  productName: string
  productSku: string
  quantity: number
  unitPrice: number
}

export type PlaceOrderInput = {
  form: unknown
  items: CartItemForOrder[]
  subtotal: number
  shippingCost: number
  total: number
  /** Token de tarjeta generado por Culqi.js (solo CULQI_CARD) */
  culqiTokenId?: string
}

type PlaceOrderResult =
  | {
      success: true
      data: {
        code: string
        paymentMethod: string
        cardNumber?: string
        culqi?: {
          orderId: string
          qrUrl: string | null
          peUrl: string | null
          paymentCode: string | null
        }
      }
    }
  | { success: false; error: string }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function splitName(fullName: string): { first_name: string; last_name: string } {
  const parts = fullName.trim().split(/\s+/)
  const first_name = parts[0] ?? fullName
  const last_name = parts.slice(1).join(' ') || first_name
  return { first_name, last_name }
}

// ---------------------------------------------------------------------------
// placeOrder — valida, crea la orden y retorna el código
// ---------------------------------------------------------------------------

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const parsed = checkoutSchema.safeParse(input.form)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Datos inválidos'
    return { success: false, error: firstError }
  }

  if (input.items.length === 0) {
    return { success: false, error: 'El carrito está vacío' }
  }

  const d = parsed.data

  try {
    // ------------------------------------------------------------------
    // 1. Para CULQI_YAPE: crear la orden en Culqi antes que en nuestra BD
    //    para obtener el QR y el código de pago.
    // ------------------------------------------------------------------
    let culqiData:
      | { orderId: string; qrUrl: string | null; peUrl: string | null; paymentCode: string | null }
      | undefined
    let culqiChargeId: string | undefined
    let culqiCardNumber: string | undefined
    let isPaid = false

    if (d.paymentMethod === 'CULQI_YAPE') {
      const { first_name, last_name } = splitName(d.fullName)

      // Generamos un order_number provisional con timestamp para que sea único
      const provisionalNumber = `MIR-${Date.now()}`

      const culqiOrder = await createCulqiOrder({
        amount: toCulqiAmount(input.total),
        currency_code: 'PEN',
        description: `Pedido Mirana Shop — ${d.fullName}`,
        order_number: provisionalNumber,
        expiration_date: culqiExpiration(24),
        client_details: {
          first_name,
          last_name,
          email: d.email,
          phone_number: d.phone,
        },
        confirm: true,
        metadata: { channel: 'storefront' },
      })

      culqiData = {
        orderId: culqiOrder.id,
        qrUrl: culqiOrder.qr,
        peUrl: culqiOrder.url_pe,
        paymentCode: culqiOrder.payment_code,
      }
    }

    if (d.paymentMethod === 'CULQI_CARD') {
      if (!input.culqiTokenId) {
        return { success: false, error: 'No se recibió el token de la tarjeta' }
      }

      const charge = await createCulqiCharge({
        amount: toCulqiAmount(input.total),
        currency_code: 'PEN',
        description: `Pedido Mirana Shop — ${d.fullName}`,
        source_id: input.culqiTokenId,
        email: d.email,
        metadata: { channel: 'storefront' },
      })

      if (charge.outcome.type !== 'venta_exitosa') {
        return {
          success: false,
          error: charge.outcome.user_message || charge.outcome.merchant_message || 'Pago rechazado',
        }
      }

      culqiChargeId = charge.id
      culqiCardNumber = charge.source.card_number
      isPaid = true
    }

    // ------------------------------------------------------------------
    // 2. Crear la orden interna en nuestra BD
    // ------------------------------------------------------------------
    const order = await orderRepo.create({
      guestEmail: d.email,
      paymentMethod: d.paymentMethod as PaymentMethod,
      items: input.items,
      subtotal: input.subtotal,
      shippingCost: input.shippingCost,
      total: input.total,
      shipping: {
        fullName: d.fullName,
        phone: d.phone,
        address: d.address,
        district: d.district,
        city: d.city,
        reference: d.reference || undefined,
      },
      culqi: culqiData
        ? {
            orderId: culqiData.orderId,
            qrUrl: culqiData.qrUrl ?? undefined,
            peUrl: culqiData.peUrl ?? undefined,
          }
        : culqiChargeId
          ? { chargeId: culqiChargeId }
          : undefined,
      isPaid,
    })

    revalidatePath('/admin/orders')
    revalidatePath('/admin/dashboard')

    return {
      success: true,
      data: {
        code: order.code,
        paymentMethod: d.paymentMethod,
        culqi: culqiData,
        cardNumber: culqiCardNumber,
      },
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al procesar el pedido',
    }
  }
}
