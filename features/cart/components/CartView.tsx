'use client'

import { CartLineItem } from '@/features/cart/components/CartLineItem'
import { cartKindOf } from '@/features/cart/lib/cart-kind'
import { useCartStore } from '@/features/cart/stores/cart.store'
import { eligibleDeliveryMethods } from '@/features/checkout/lib/delivery-eligibility'
import { computeTotals, type PricingRules } from '@/features/checkout/lib/pricing'
import { splitPreorderTotals } from '@/features/checkout/lib/preorder'
import { buttonClass } from '@/shared/components/ui/Button'
import { formatCurrency } from '@/shared/lib/utils'
import { ArrowLeft, CreditCard, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EmptyState } from '@/shared/components/ui/EmptyState'

interface CartViewProps {
  /** Reglas de precios (envío y promociones activas) calculadas en el server */
  pricingRules: PricingRules
}

export function CartView({ pricingRules }: CartViewProps) {
  const cart = useCartStore((s) => s.cart)
  const router = useRouter()

  const { subtotal, payableNow, dueTotal } = splitPreorderTotals(
    cart,
    pricingRules.preorderDepositPercent,
  )
  const itemCount = cart.reduce((s, i) => s + i.qty, 0)
  // Las entregas que este carrito va a poder elegir: la preventa se coordina y
  // no se despacha a domicilio (features/checkout/lib/delivery-eligibility.ts).
  const deliveryMethods = eligibleDeliveryMethods(
    pricingRules.deliveryMethods,
    cartKindOf(cart.map((i) => i.product)),
  )
  // Las promociones se calculan sobre lo que se cobra hoy, no sobre el valor
  // completo del pedido (ver features/checkout/lib/preorder.ts). El envío que
  // se adelanta es el de la entrega que el checkout va a preseleccionar para
  // ESTE carrito, no el primero del admin: con un carrito de preventa el envío
  // a domicilio ni siquiera es elegible.
  const { shippingFree, shippingCost, discount, discountName, total } = computeTotals(
    payableNow,
    pricingRules,
    { shippingCost: deliveryMethods[0]?.cost },
  )

  /* ── Empty state ─────────────────────────────────── */
  if (cart.length === 0) {
    return (
      <EmptyState
        size="page"
        icon={ShoppingBag}
        title="Tu carrito está vacío"
        description="Explora el catálogo y agrega productos para continuar."
        className="min-h-[70vh] justify-center pt-9"
        action={
          <Link href="/catalogo" className={buttonClass({ variant: 'accent', size: 'lg' })}>
            Ver catálogo
          </Link>
        }
      />
    )
  }

  return (
    <>
      <div className="px-4 sm:px-6 pt-9 pb-12 max-w-360 mx-auto">
        {/* ── Page header ── */}
        <div className="flex items-center gap-4 mb-6 sm:mb-10">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-11 h-11 -ml-3 flex items-center justify-center text-muted hover:text-accent-ink transition-colors duration-200"
            aria-label="Volver"
          >
            <ArrowLeft size={20} aria-hidden />
          </button>
          <h1 className="font-display text-[24px] sm:text-[32px] font-black uppercase tracking-tight">
            Mi Carrito <span className="text-accent-ink">({itemCount})</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 items-start">
          {/* ── Items list ──────────────────────────────── */}
          <div className="flex flex-col gap-4">
            {cart.map((item) => (
              <CartLineItem
                key={item.product.id}
                item={item}
                depositPercent={pricingRules.preorderDepositPercent}
                variant="full"
              />
            ))}
          </div>

          {/* ── Order summary ────────────────────────────── */}
          <div className="lg:sticky lg:top-[calc(var(--nh)+24px)] bg-(--surf) border border-(--bd) p-5 sm:p-7 flex flex-col gap-5">
            <h2 className="font-display text-[20px] font-black uppercase tracking-tight">
              Resumen del pedido
            </h2>

            <div className="flex flex-col gap-3.5 text-[14px]">
              <div className="flex justify-between items-baseline">
                <span className="text-muted">
                  {dueTotal > 0 ? 'Subtotal a pagar hoy' : 'Subtotal'}{' '}
                  <span className="text-muted">
                    ({itemCount} {itemCount === 1 ? 'producto' : 'productos'})
                  </span>
                </span>
                <span className="font-semibold">{formatCurrency(payableNow)}</span>
              </div>

              {dueTotal > 0 && (
                <div className="flex justify-between items-baseline text-[13px]">
                  <span className="text-muted">Valor total del pedido</span>
                  <span className="text-muted">{formatCurrency(subtotal)}</span>
                </div>
              )}

              {discount > 0 && (
                <div className="flex justify-between items-baseline">
                  <span className="text-muted">
                    Descuento{discountName ? ` — ${discountName}` : ''}
                  </span>
                  <span className="text-success font-semibold">−{formatCurrency(discount)}</span>
                </div>
              )}

              <div className="flex justify-between items-baseline">
                <span className="text-muted">Envío</span>
                {shippingFree || shippingCost === 0 ? (
                  <span className="text-success font-semibold text-[13px]">Gratis</span>
                ) : (
                  <span className="font-semibold">{formatCurrency(shippingCost)}</span>
                )}
              </div>

              {/* El costo mostrado es el de la forma de entrega preseleccionada;
                  el cliente puede cambiarla (y con ella el costo) en el checkout. */}
              {deliveryMethods.length > 1 && (
                <p className="text-[12px] text-muted leading-snug">
                  Eliges la forma de entrega en el checkout:{' '}
                  {deliveryMethods.map((m) => m.name).join(' o ')}.
                </p>
              )}

              {!shippingFree && shippingCost > 0 && pricingRules.freeShippingThreshold != null && (
                <div className="text-[12px] text-muted border border-(--bd) px-3.5 py-2.5 leading-relaxed">
                  Agrega{' '}
                  <span className="text-accent-ink font-semibold">
                    {formatCurrency(pricingRules.freeShippingThreshold - subtotal)}
                  </span>{' '}
                  más para obtener envío gratis.
                </div>
              )}

              <div className="border-t border-(--bd) pt-3.5 flex justify-between items-baseline">
                <span className="text-[12px] uppercase tracking-[1.5px] text-muted">
                  {dueTotal > 0 ? 'Pagas hoy' : 'Total'}
                </span>
                <span className="font-display text-[34px] font-black text-accent-ink leading-none">
                  {formatCurrency(total)}
                </span>
              </div>

              {dueTotal > 0 && (
                <div className="flex justify-between items-baseline border border-(--bd) px-3.5 py-2.5">
                  <span className="text-[12px] text-muted">Saldo pendiente</span>
                  <span className="text-info font-semibold">{formatCurrency(dueTotal)}</span>
                </div>
              )}
            </div>

            {/* Navegación = enlaces (Ctrl+click, prefetch), con estilo de botón */}
            <Link
              href="/checkout"
              className={buttonClass({ variant: 'accent', size: 'lg', full: true })}
            >
              <CreditCard size={16} aria-hidden />
              Proceder al pago
            </Link>

            <Link
              href="/catalogo"
              className={buttonClass({ variant: 'outline', size: 'md', full: true })}
            >
              <ArrowLeft size={15} aria-hidden /> Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
