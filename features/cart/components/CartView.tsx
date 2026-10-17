'use client'

import { cartKindOf } from '@/features/cart/lib/cart-kind'
import { removeWithUndo } from '@/features/cart/lib/remove-with-undo'
import { useCartStore } from '@/features/cart/stores/cart.store'
import { eligibleDeliveryMethods } from '@/features/checkout/lib/delivery-eligibility'
import {
  computeTotals,
  effectivePrice,
  type PricingRules,
} from '@/features/checkout/lib/pricing'
import {
  canPartialPreorder,
  depositUnitPrice,
  splitPreorderTotals,
} from '@/features/checkout/lib/preorder'
import { maxPurchasable } from '@/features/products/lib/stock'
import { getCategoryLabel, getCategoryStripe } from '@/features/products/types/catalog.types'
import { buttonClass } from '@/shared/components/ui/Button'
import { formatCurrency } from '@/shared/lib/utils'
import { ArrowLeft, CreditCard, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { FadeImage } from '@/shared/components/ui/FadeImage'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EmptyState } from '@/shared/components/ui/EmptyState'

interface CartViewProps {
  /** Reglas de precios (envío y promociones activas) calculadas en el server */
  pricingRules: PricingRules
}

export function CartView({ pricingRules }: CartViewProps) {
  const cart = useCartStore((s) => s.cart)
  const updateQty = useCartStore((s) => s.updateQty)
  const setLineMode = useCartStore((s) => s.setLineMode)
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
            {cart.map((item) => {
              const stripe = getCategoryStripe(item.product.category.slug)
              const catLabel = getCategoryLabel(item.product.category.slug)
              const fullUnit = effectivePrice(item.product)
              const canPartial = canPartialPreorder(item.product)
              const isPartial = item.preorderMode === 'PARTIAL'
              const depositUnit = canPartial
                ? depositUnitPrice(item.product, pricingRules.preorderDepositPercent)
                : fullUnit
              // La línea muestra lo que se cobra hoy: el adelanto si es parcial.
              const unitPrice = isPartial ? depositUnit : fullUnit
              const lineTotal = unitPrice * item.qty
              const max = maxPurchasable(item.product)
              const atLimit = max !== null && item.qty >= max

              return (
                <div
                  key={item.product.id}
                  className="flex flex-col sm:flex-row gap-4 sm:gap-5 p-4 sm:p-5 bg-(--surf) border border-(--bd) sm:items-center"
                >
                  <div className="flex gap-4 sm:gap-5 sm:flex-1 min-w-0">
                    {/* Image / stripe */}
                    <Link
                      href={`/catalogo/${item.product.slug}`}
                      className="relative shrink-0 block w-20 h-20 sm:w-24 sm:h-24 overflow-hidden bg-skeleton"
                      tabIndex={-1}
                      aria-hidden
                    >
                      {item.product.imageUrl ? (
                        <FadeImage
                          src={item.product.imageUrl}
                          alt=""
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      ) : (
                        <div className={`${stripe} w-full h-full`} />
                      )}
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] tracking-[2px] uppercase text-muted mb-1">
                        {catLabel} · {item.product.brand.name}
                      </div>
                      <Link
                        href={`/catalogo/${item.product.slug}`}
                        className="block font-display text-[16px] sm:text-[18px] font-black uppercase leading-tight hover:text-accent-ink transition-colors duration-150 truncate"
                      >
                        {item.product.name}
                      </Link>
                      <div className="text-accent-ink font-display text-[15px] font-bold mt-0.5">
                        {formatCurrency(unitPrice)} c/u
                      </div>

                      {/* Preventa: se puede alternar entre pagar todo y pagar
                          solo el adelanto sin volver a la ficha del producto. */}
                      {canPartial && (
                        <div className="flex items-center border border-(--bd) w-fit mt-2">
                          {(
                            [
                              { mode: 'FULL' as const, label: 'Pago total', amount: fullUnit },
                              {
                                mode: 'PARTIAL' as const,
                                label: 'Adelanto',
                                amount: depositUnit,
                              },
                            ]
                          ).map((opt) => (
                            <button
                              key={opt.mode}
                              type="button"
                              onClick={() => setLineMode(item.product.id, opt.mode)}
                              aria-pressed={item.preorderMode === opt.mode}
                              className={`px-3 min-h-11 text-[11px] tracking-[1px] uppercase font-display font-extrabold transition-colors duration-150 ${
                                item.preorderMode === opt.mode
                                  ? 'bg-(--gold) text-on-accent'
                                  : 'text-muted hover:text-text'
                              }`}
                            >
                              {opt.label} · {formatCurrency(opt.amount)}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Qty controls */}
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center border border-(--bd) bg-bg">
                          <button
                            type="button"
                            onClick={() => updateQty(item.product.id, -1)}
                            disabled={item.qty <= 1}
                            className="w-11 h-11 flex items-center justify-center text-muted hover:text-text disabled:opacity-30 transition-colors duration-150"
                            aria-label={`Quitar una unidad de "${item.product.name}"`}
                          >
                            <Minus size={13} aria-hidden />
                          </button>
                          <span
                            className="font-display font-extrabold text-[15px] min-w-8 text-center"
                            aria-live="polite"
                          >
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQty(item.product.id, 1)}
                            disabled={atLimit}
                            className="w-11 h-11 flex items-center justify-center text-muted hover:text-text disabled:opacity-30 transition-colors duration-150"
                            aria-label={`Agregar una unidad de "${item.product.name}"`}
                          >
                            <Plus size={13} aria-hidden />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeWithUndo(item)}
                          className="w-11 h-11 flex items-center justify-center text-muted hover:text-danger transition-colors duration-200"
                          aria-label={`Eliminar "${item.product.name}" del carrito`}
                        >
                          <Trash2 size={15} aria-hidden />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Line total */}
                  <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center shrink-0 pt-3 sm:pt-0 border-t border-(--bd) sm:border-t-0">
                    <div className="font-display text-[20px] sm:text-[22px] font-black text-accent-ink">
                      {formatCurrency(lineTotal)}
                    </div>
                    {item.qty > 1 && (
                      <div className="text-[11px] text-muted sm:mt-0.5">
                        {item.qty} × {formatCurrency(unitPrice)}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
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
            <Link href="/checkout" className={buttonClass({ variant: 'accent', size: 'lg', full: true })}>
              <CreditCard size={16} aria-hidden />
              Proceder al pago
            </Link>

            <Link href="/catalogo" className={buttonClass({ variant: 'outline', size: 'md', full: true })}>
              <ArrowLeft size={15} aria-hidden /> Seguir comprando
            </Link>
          </div>
        </div>
      </div>

    </>
  )
}
