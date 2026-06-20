'use server'

import type { PaymentMethod } from '@/generated/prisma/client'
import { checkoutSchema } from '@/features/checkout/schemas/checkout.schema'
import { reserveStockForOrder } from '@/features/inventory/lib/stock'
import { db } from '@/shared/lib/db'
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
}

type PlaceOrderResult =
  | { success: true; data: { code: string; paymentMethod: string } }
  | { success: false; error: string }

// ---------------------------------------------------------------------------
// placeOrder — valida, crea la orden (con reserva de stock) y retorna el código
//
// El pago es manual: el cliente envía el comprobante por WhatsApp con este
// código y un admin valida/acepta el pedido desde /admin/orders.
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
    const order = await db.$transaction(async (tx) => {
      const year = new Date().getFullYear()
      const count = await tx.order.count()
      const code = `MIR-${year}-${String(count + 1).padStart(4, '0')}`

      const created = await tx.order.create({
        data: {
          code,
          guestEmail: d.email,
          paymentMethod: d.paymentMethod as PaymentMethod,
          status: 'AWAITING_PROOF',
          paymentStatus: 'UNPAID',
          subtotal: input.subtotal,
          shippingCost: input.shippingCost,
          total: input.total,
          currency: 'PEN',
          items: {
            create: input.items.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              productSku: item.productSku,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
          payment: {
            create: {
              method: d.paymentMethod as PaymentMethod,
              status: 'UNPAID',
              amount: input.total,
              currency: 'PEN',
            },
          },
          shipping: {
            create: {
              fullName: d.fullName,
              phone: d.phone,
              address: d.address,
              district: d.district,
              city: d.city,
              reference: d.reference || undefined,
            },
          },
        },
        select: { id: true, code: true },
      })

      for (const item of input.items) {
        await reserveStockForOrder(tx, {
          productId: item.productId,
          quantity: item.quantity,
          orderId: created.id,
          reason: `Reserva por pedido ${code}`,
        })
      }

      return created
    })

    revalidatePath('/admin/orders')
    revalidatePath('/admin/dashboard')

    return {
      success: true,
      data: { code: order.code, paymentMethod: d.paymentMethod },
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al procesar el pedido',
    }
  }
}
