'use server'

import type { PaymentMethod } from '@/generated/prisma/client'
import {
  depositUnitPrice,
  effectiveMode,
  type PreorderMode,
} from '@/features/checkout/lib/preorder'
import { computeTotals, effectivePrice } from '@/features/checkout/lib/pricing'
import { getPricingRules } from '@/features/checkout/queries/pricing.queries'
import { checkoutSchema } from '@/features/checkout/schemas/checkout.schema'
import { reserveStockForOrder } from '@/features/inventory/lib/stock'
import { db } from '@/shared/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type CartItemForOrder = {
  productId: string
  quantity: number
  /** Forma de pago pedida por el cliente. Se revalida contra la BD. */
  preorderMode?: PreorderMode
}

export type PlaceOrderInput = {
  form: unknown
  items: CartItemForOrder[]
  /** Total que vio el cliente — solo para detectar precios desactualizados */
  clientTotal?: number
}

export type PlaceOrderTotals = {
  /** Valor completo del pedido (sin descontar el saldo de las preventas parciales) */
  subtotal: number
  discount: number
  discountName: string | null
  shippingCost: number
  /** Lo que el cliente paga ahora */
  total: number
  /** Saldo pendiente por preventa parcial; 0 en pedidos normales */
  dueTotal: number
}

type PlaceOrderResult =
  | { success: true; data: { code: string; paymentMethod: string } & PlaceOrderTotals }
  | { success: false; error: string }

const itemsSchema = z
  .array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().min(1).max(99),
      preorderMode: z.enum(['FULL', 'PARTIAL']).optional().default('FULL'),
    }),
  )
  .min(1, 'El carrito está vacío')
  .max(50)

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

  const parsedItems = itemsSchema.safeParse(input.items)
  if (!parsedItems.success) {
    return { success: false, error: parsedItems.error.issues[0]?.message ?? 'Carrito inválido' }
  }

  const d = parsed.data
  const requestedItems = parsedItems.data

  // SEGURIDAD: el cliente solo envía productId + cantidad. Precios, subtotal,
  // promociones (envío gratis / descuentos) y total se recalculan SIEMPRE
  // desde la BD — nunca se confía en los montos del navegador.
  const products = await db.product.findMany({
    where: { id: { in: requestedItems.map((i) => i.productId) }, deletedAt: null },
    select: {
      id: true,
      name: true,
      sku: true,
      price: true,
      salePrice: true,
      status: true,
      allowPartialPreorder: true,
      preorderDepositPercent: true,
    },
  })
  const productById = new Map(products.map((p) => [p.id, p]))

  const rules = await getPricingRules()

  const orderItems: {
    productId: string
    productName: string
    productSku: string
    quantity: number
    unitPrice: number
    isPreorder: boolean
    preorderMode: PreorderMode
    depositUnitPrice: number | null
  }[] = []

  for (const item of requestedItems) {
    const product = productById.get(item.productId)
    if (!product || product.status === 'ARCHIVED') {
      return { success: false, error: 'Un producto de tu carrito ya no está disponible' }
    }

    const pricing = {
      price: Number(product.price),
      salePrice: product.salePrice != null ? Number(product.salePrice) : null,
      status: product.status,
      allowPartialPreorder: product.allowPartialPreorder,
      preorderDepositPercent: product.preorderDepositPercent,
    }

    // El modo se recalcula contra la BD: un payload que pida 'PARTIAL' para un
    // producto que no lo admite se cobra completo.
    const mode = effectiveMode(pricing, item.preorderMode)

    orderItems.push({
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      quantity: item.quantity,
      unitPrice: effectivePrice(pricing),
      isPreorder: product.status === 'PREORDER',
      preorderMode: mode,
      depositUnitPrice:
        mode === 'PARTIAL' ? depositUnitPrice(pricing, rules.preorderDepositPercent) : null,
    })
  }

  const round2 = (n: number) => Math.round(n * 100) / 100

  // `subtotal` sigue siendo el valor completo del pedido; `payableNow` es lo que
  // se cobra hoy (el adelanto en las líneas parciales). Sin líneas parciales son
  // iguales y todo el cálculo queda idéntico a como era.
  const subtotal = round2(orderItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0))
  const payableNow = round2(
    orderItems.reduce((s, i) => s + (i.depositUnitPrice ?? i.unitPrice) * i.quantity, 0),
  )
  const dueTotal = round2(subtotal - payableNow)

  const totals = computeTotals(payableNow, rules)

  // Si el cliente vio un total distinto (cambió un precio o una promo mientras
  // compraba), no procesamos el pedido con montos sorpresa.
  if (input.clientTotal != null && Math.abs(input.clientTotal - totals.total) > 0.01) {
    return {
      success: false,
      error:
        'Los precios u ofertas cambiaron mientras comprabas. Revisa el resumen e inténtalo de nuevo.',
    }
  }

  // El código MIR-YYYY-NNNN se calcula con count(): dos checkouts simultáneos
  // pueden chocar en el unique de `code` — reintentamos hasta 3 veces.
  const MAX_CODE_RETRIES = 3

  const createOrder = async () =>
    db.$transaction(async (tx) => {
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
          subtotal,
          shippingCost: totals.shippingCost,
          discountTotal: totals.discount,
          total: totals.total,
          dueTotal,
          currency: 'PEN',
          items: {
            create: orderItems.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              productSku: item.productSku,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              isPreorder: item.isPreorder,
              preorderMode: item.preorderMode,
              depositUnitPrice: item.depositUnitPrice,
            })),
          },
          payment: {
            create: {
              method: d.paymentMethod as PaymentMethod,
              status: 'UNPAID',
              amount: totals.total,
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

      for (const item of orderItems) {
        await reserveStockForOrder(tx, {
          productId: item.productId,
          quantity: item.quantity,
          orderId: created.id,
          // La preventa no descuenta stock disponible (no lo tiene): se anota
          // en preorderedStock. Sin esto el checkout de preventas fallaba.
          isPreorder: item.isPreorder,
          reason: `Reserva por pedido ${code}`,
        })
      }

      return created
    })

  try {
    let order: { id: string; code: string } | null = null
    for (let attempt = 1; attempt <= MAX_CODE_RETRIES; attempt++) {
      try {
        order = await createOrder()
        break
      } catch (err) {
        const isCodeCollision =
          typeof err === 'object' && err !== null && (err as { code?: string }).code === 'P2002'
        if (!isCodeCollision || attempt === MAX_CODE_RETRIES) throw err
      }
    }
    if (!order) throw new Error('No se pudo generar el código del pedido')

    revalidatePath('/admin/orders')
    revalidatePath('/admin/dashboard')

    return {
      success: true,
      data: {
        code: order.code,
        paymentMethod: d.paymentMethod,
        subtotal,
        discount: totals.discount,
        discountName: totals.discountName,
        shippingCost: totals.shippingCost,
        total: totals.total,
        dueTotal,
      },
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al procesar el pedido',
    }
  }
}
