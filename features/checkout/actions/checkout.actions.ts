'use server'

import type { PaymentMethod, ProductStatus } from '@/generated/prisma/client'
import { cartKindOf, hasMixedKinds } from '@/features/cart/lib/cart-kind'
import {
  depositUnitPrice,
  effectiveMode,
  type PreorderMode,
} from '@/features/checkout/lib/preorder'
import {
  eligibleDeliveryMethods,
  isDeliveryMethodEligible,
} from '@/features/checkout/lib/delivery-eligibility'
import { computeTotals, effectivePrice } from '@/features/checkout/lib/pricing'
import { getPricingRules } from '@/features/checkout/queries/pricing.queries'
import { buildCheckoutSchema } from '@/features/checkout/schemas/checkout.schema'
import {
  findRedeemableCoupon,
  type RedeemableCoupon,
} from '@/features/coupons/queries/coupon.queries'
import { getActiveDeliveryMethodById } from '@/features/delivery/queries/delivery.queries'
import { formatDeliveryLocation, type DeliveryMethodOption } from '@/features/delivery/types'
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
  /** Cupón realmente canjeado; null si el beneficio vino de una promo automática */
  couponCode: string | null
  shippingCost: number
  /** Nombre de la forma de entrega; null si la tienda no configuró ninguna */
  deliveryLabel: string | null
  /** Sede de retiro elegida, ya formateada; null si no aplica */
  deliveryLocation: string | null
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

/** Lo mínimo que hace falta leer del formulario antes de conocer sus reglas */
const deliveryPickSchema = z.object({
  deliveryMethodId: z.string().optional(),
  couponCode: z.string().optional(),
})

// ---------------------------------------------------------------------------
// placeOrder — valida, crea la orden (con reserva de stock) y retorna el código
//
// El pago es manual: el cliente envía el comprobante por WhatsApp con este
// código y un admin valida/acepta el pedido desde /admin/orders.
// ---------------------------------------------------------------------------

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const parsedItems = itemsSchema.safeParse(input.items)
  if (!parsedItems.success) {
    return { success: false, error: parsedItems.error.issues[0]?.message ?? 'Carrito inválido' }
  }

  // SEGURIDAD: el formulario se valida contra las reglas que dicta la BD, no
  // contra las que diga el navegador. Primero se lee qué método pidió el
  // cliente, se carga de la BD y recién ahí se arma el esquema definitivo: así
  // un payload manipulado no puede saltarse la dirección de un envío.
  const picked = deliveryPickSchema.safeParse(input.form)
  if (!picked.success) {
    return { success: false, error: 'Datos de entrega inválidos' }
  }

  const rules = await getPricingRules()

  // SEGURIDAD: el cliente solo envía productId + cantidad. Precios, subtotal,
  // promociones (envío gratis / descuentos) y total se recalculan SIEMPRE
  // desde la BD — nunca se confía en los montos del navegador.
  //
  // Se lee antes que la forma de entrega porque el estado de los productos es
  // lo que decide qué entregas valen para este pedido.
  const products = await db.product.findMany({
    where: { id: { in: parsedItems.data.map((i) => i.productId) }, deletedAt: null },
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
  /** Estados tal como están en la BD — para decidir el tipo del pedido. */
  const orderProducts: { status: ProductStatus }[] = []

  for (const item of parsedItems.data) {
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

    orderProducts.push({ status: product.status })
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

  // Un pedido es de preventa o de entrega inmediata, nunca los dos: cambian la
  // fecha de entrega y la forma de envío. El carrito ya lo impide en el cliente,
  // pero estas actions son un endpoint público — y un producto puede haber
  // pasado a preventa mientras el carrito estaba armado.
  if (hasMixedKinds(orderProducts)) {
    return {
      success: false,
      error:
        'No puedes combinar productos de preventa con productos de entrega inmediata en el mismo pedido. Deja solo uno de los dos tipos en tu carrito.',
    }
  }
  const orderKind = cartKindOf(orderProducts)

  // La lista se recorta al tipo del pedido antes de exigir una elección: si la
  // tienda no tiene ninguna entrega compatible, el checkout tampoco mostró el
  // selector y se cae al envío base, igual que cuando no hay ninguna configurada.
  const hasDeliveryMethods = eligibleDeliveryMethods(rules.deliveryMethods, orderKind).length > 0

  let method: DeliveryMethodOption | null = null
  if (hasDeliveryMethods) {
    const methodId = (picked.data.deliveryMethodId ?? '').trim()
    if (!methodId) return { success: false, error: 'Selecciona una forma de entrega' }

    method = await getActiveDeliveryMethodById(methodId)
    if (!method) {
      return {
        success: false,
        error: 'La forma de entrega elegida ya no está disponible. Elige otra e inténtalo de nuevo.',
      }
    }
    if (!isDeliveryMethodEligible(method, orderKind)) {
      return {
        success: false,
        error: 'Esa forma de entrega no está disponible para los productos de tu pedido',
      }
    }
  }

  const requiresLocation = method != null && method.requiresLocation && method.locations.length > 0

  const parsed = buildCheckoutSchema({
    requiresMethod: hasDeliveryMethods,
    requiresAddress: method ? method.requiresAddress : true,
    requiresLocation,
  }).safeParse(input.form)

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Datos inválidos'
    return { success: false, error: firstError }
  }

  const d = parsed.data

  // La sede tiene que pertenecer al método elegido
  const location = requiresLocation
    ? (method?.locations.find((loc) => loc.id === d.deliveryLocationId) ?? null)
    : null
  if (requiresLocation && !location) {
    return { success: false, error: 'La tienda de retiro elegida ya no está disponible' }
  }

  // El cupón se vuelve a resolver contra la BD: el beneficio nunca se toma del
  // navegador, solo el código escrito.
  let coupon: RedeemableCoupon | null = null
  const rawCouponCode = (d.couponCode ?? '').trim()
  if (rawCouponCode) {
    const lookup = await findRedeemableCoupon(rawCouponCode)
    if (!lookup.ok) return { success: false, error: lookup.error }
    coupon = lookup.coupon
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

  const totals = computeTotals(payableNow, rules, {
    shippingCost: method?.cost,
    coupon: coupon?.rule ?? null,
  })

  // Si el cliente vio un total distinto (cambió un precio o una promo mientras
  // compraba), no procesamos el pedido con montos sorpresa.
  if (input.clientTotal != null && Math.abs(input.clientTotal - totals.total) > 0.01) {
    return {
      success: false,
      error:
        'Los precios u ofertas cambiaron mientras comprabas. Revisa el resumen e inténtalo de nuevo.',
    }
  }

  // Solo se consume el cupón si computeTotals lo terminó aplicando: si su
  // descuento perdió contra una promoción automática mejor, el código sigue
  // disponible para otra compra.
  const redeemedCoupon = coupon != null && totals.couponCode === coupon.code ? coupon : null
  const deliveryLocationText = location ? formatDeliveryLocation(location) : null

  // El código MIR-YYYY-NNNN se calcula con count(): dos checkouts simultáneos
  // pueden chocar en el unique de `code` — reintentamos hasta 3 veces.
  const MAX_CODE_RETRIES = 3

  const createOrder = async () =>
    db.$transaction(async (tx) => {
      // Se consume el cupón ANTES de crear el pedido y con las condiciones en
      // el WHERE: si dos clientes canjean el último uso a la vez, el segundo
      // no encuentra fila que actualizar y la transacción se revierte entera.
      if (redeemedCoupon) {
        const claimed = await tx.coupon.updateMany({
          where: {
            id: redeemedCoupon.id,
            active: true,
            ...(redeemedCoupon.maxUses != null
              ? { usedCount: { lt: redeemedCoupon.maxUses } }
              : {}),
          },
          data: { usedCount: { increment: 1 } },
        })
        if (claimed.count === 0) {
          throw new Error('El cupón alcanzó su límite de canjes. Quítalo e inténtalo de nuevo.')
        }
      }

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
          deliveryMethodId: method?.id ?? null,
          deliveryMethodName: method?.name ?? '',
          // Sin formas de entrega configuradas el pedido igual queda etiquetado
          // por lo que es: un pedido de preventa no se despacha como un envío.
          deliveryKind: method?.kind ?? (orderKind === 'PREORDER' ? 'PREORDER' : 'SHIPPING'),
          deliveryLocation: deliveryLocationText,
          couponId: redeemedCoupon?.id ?? null,
          couponCode: totals.couponCode,
          // El checkout no deja confirmar sin marcar la casilla; se guarda la
          // fecha como constancia de esa aceptación.
          termsAcceptedAt: new Date(),
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
              dni: d.dni,
              // En retiro en tienda y preventa no se pide dirección: la fila
              // guarda solo el contacto y la sede vive en el pedido.
              address: d.address?.trim() ?? '',
              district: d.district?.trim() ?? '',
              city: d.city?.trim() || 'Lima',
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
    if (redeemedCoupon) revalidatePath('/admin/coupons')

    return {
      success: true,
      data: {
        code: order.code,
        paymentMethod: d.paymentMethod,
        subtotal,
        discount: totals.discount,
        discountName: totals.discountName,
        couponCode: totals.couponCode,
        shippingCost: totals.shippingCost,
        deliveryLabel: method?.name ?? null,
        deliveryLocation: deliveryLocationText,
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
