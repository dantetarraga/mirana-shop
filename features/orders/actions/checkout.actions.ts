'use server'

import type { PaymentMethod } from '@/generated/prisma/client'
import { orderRepo } from '@/modules/orders/repositories/order.repo'
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
}

type PlaceOrderResult =
  | { success: true; data: { code: string; paymentMethod: string } }
  | { success: false; error: string }

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
    })

    revalidatePath('/admin/orders')
    revalidatePath('/admin/dashboard')

    return { success: true, data: { code: order.code, paymentMethod: d.paymentMethod } }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al procesar el pedido',
    }
  }
}
