'use client'

import { depositUnitPrice, type PreorderMode } from '@/features/checkout/lib/preorder'
import { effectivePrice } from '@/features/checkout/lib/pricing'
import { Button } from '@/shared/components/ui/Button'
import { formatCurrency } from '@/shared/lib/utils'
import { ArrowLeft, ArrowRight, Loader2, Truck } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'

type CartItem = {
  product: {
    id: string
    name: string
    imageUrl: string | null
    price: number
    salePrice: number | null
    status: string
    allowPartialPreorder: boolean
    preorderDepositPercent: number | null
  }
  qty: number
  preorderMode: PreorderMode
}

type Props = {
  cart: CartItem[]
  /** Valor completo del pedido */
  subtotal: number
  /** Lo que se cobra hoy, antes de envío y descuentos */
  payableNow: number
  /** Saldo pendiente por preventa parcial; 0 en pedidos normales */
  dueTotal: number
  /** % de adelanto por defecto de la tienda */
  depositPercent: number
  shippingCost: number
  shippingFree: boolean
  discount: number
  discountName: string | null
  /** Código del cupón que produjo el beneficio; null si fue una promo automática */
  couponCode: string | null
  total: number
  loading: boolean
  /** null = no hay promoción de envío gratis activa */
  shippingThreshold: number | null
  /** Nombre de la forma de entrega elegida, para el desglose */
  deliveryLabel: string | null
  /** Casilla de Términos y Condiciones — obligatoria para comprar */
  registerTerms: UseFormRegisterReturn
  termsError?: string
  /** Campo de cupón — se canjea acá, junto al total que modifica */
  couponSlot?: ReactNode
  /** El paso visible es el último: recién ahí se confirma el pedido */
  isLastStep: boolean
  /** El paso visible es el primero: el botón secundario vuelve al carrito */
  isFirstStep: boolean
  /** Avanzar al siguiente paso (valida el actual) */
  onNext: () => void
  /** Retroceder un paso */
  onBack: () => void
}

export function OrderSummary({
  cart,
  subtotal,
  payableNow,
  dueTotal,
  depositPercent,
  shippingCost,
  shippingFree,
  discount,
  discountName,
  couponCode,
  total,
  loading,
  shippingThreshold,
  deliveryLabel,
  registerTerms,
  termsError,
  couponSlot,
  isLastStep,
  isFirstStep,
  onNext,
  onBack,
}: Props) {
  // Un método de retiro cuesta 0 sin que exista promoción de envío gratis: en
  // ambos casos al cliente hay que decirle "Gratis", no "S/ 0.00".
  const shippingIsFree = shippingFree || shippingCost === 0
  return (
    <div className="lg:sticky lg:top-6 flex flex-col gap-4">
      <div className="bg-card border border-(--bd) p-6">
        <h2 className="font-display font-black uppercase text-[13px] tracking-[2px] text-accent-ink mb-4">
          Resumen del pedido
        </h2>

        {/* Items */}
        <ul className="flex flex-col gap-3 mb-1 max-h-64 overflow-y-auto pr-1">
          {cart.map((item) => {
            const isPartial = item.preorderMode === 'PARTIAL'
            // En las líneas parciales se muestra el adelanto: es lo que suma al
            // total que el cliente va a pagar hoy.
            const unit = isPartial
              ? depositUnitPrice(item.product, depositPercent)
              : effectivePrice(item.product)
            return (
              <li key={item.product.id} className="flex gap-3 items-start">
                <div className="w-12 h-12 bg-surf border border-(--bd) shrink-0 overflow-hidden">
                  {item.product.imageUrl ? (
                    <Image
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full stripe-fig" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-[13px] uppercase leading-tight truncate">
                    {item.product.name}
                  </p>
                  <p className="text-[11px] text-muted">
                    {item.qty} × {formatCurrency(unit)}
                    {isPartial && <span className="text-info"> · adelanto</span>}
                  </p>
                </div>
                <span className="font-semibold text-[13px] shrink-0">
                  {formatCurrency(unit * item.qty)}
                </span>
              </li>
            )
          })}
        </ul>

        {/* Cupón — antes de los totales, que es lo que modifica */}
        {couponSlot}

        {/* Totals */}
        <div className="border-t border-(--bd) pt-4 mt-4 flex flex-col gap-2">
          <div className="flex justify-between text-[13px]">
            <span className="text-muted">{dueTotal > 0 ? 'Subtotal a pagar hoy' : 'Subtotal'}</span>
            <span>{formatCurrency(payableNow)}</span>
          </div>

          {dueTotal > 0 && (
            <div className="flex justify-between text-[12px]">
              <span className="text-muted">Valor total del pedido</span>
              <span className="text-muted">{formatCurrency(subtotal)}</span>
            </div>
          )}

          {discount > 0 && (
            <div className="flex justify-between text-[13px] gap-3">
              <span className="text-muted min-w-0">
                Descuento{discountName ? ` — ${discountName}` : ''}
                {couponCode && (
                  <span className="font-mono text-[11px] text-accent-ink"> · {couponCode}</span>
                )}
              </span>
              <span className="text-emerald-400 font-semibold shrink-0">
                −{formatCurrency(discount)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-[13px] gap-3">
            <span className="text-muted min-w-0 truncate">{deliveryLabel ?? 'Envío'}</span>
            {shippingIsFree ? (
              <span className="text-emerald-400 font-semibold text-[12px] uppercase tracking-wide shrink-0">
                Gratis
              </span>
            ) : (
              <span className="shrink-0">{formatCurrency(shippingCost)}</span>
            )}
          </div>

          {!shippingIsFree && shippingThreshold != null && (
            <p className="text-[11px] text-muted leading-snug">
              Agrega{' '}
              <span className="text-text font-semibold">
                {formatCurrency(shippingThreshold - payableNow)}
              </span>{' '}
              más para envío gratis.
            </p>
          )}

          <div className="flex justify-between font-display font-black text-[18px] uppercase tracking-tight border-t border-(--bd) pt-3 mt-1">
            <span>{dueTotal > 0 ? 'Pagas hoy' : 'Total'}</span>
            <span className="text-accent-ink">{formatCurrency(total)}</span>
          </div>

          {dueTotal > 0 && (
            <div className="flex justify-between text-[12px] border border-(--bd) px-3 py-2 mt-1">
              <span className="text-muted">Saldo pendiente</span>
              <span className="text-info font-semibold">{formatCurrency(dueTotal)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Términos y condiciones — solo en el último paso, junto al botón que
          confirma: es lo que se está aceptando al pulsarlo. */}
      <div className={`bg-card border border-(--bd) px-4 py-3.5 ${isLastStep ? '' : 'hidden'}`}>
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            {...registerTerms}
            aria-invalid={termsError ? true : undefined}
            className="mt-0.5 accent-(--gold) w-4 h-4 shrink-0"
          />
          <span className="text-[12px] leading-snug">
            He leído y acepto los{' '}
            <Link
              href="/terminos-y-condiciones"
              target="_blank"
              className="text-accent-ink underline"
            >
              Términos y Condiciones
            </Link>{' '}
            y la{' '}
            <Link
              href="/politica-de-privacidad"
              target="_blank"
              className="text-accent-ink underline"
            >
              Política de Privacidad
            </Link>
            .
          </span>
        </label>
        {termsError && <p className="text-red-500 text-[12px] mt-2">{termsError}</p>}
      </div>

      {/* CTA — solo el último paso confirma; los anteriores avanzan */}
      {isLastStep ? (
        <Button type="submit" variant="accent" size="lg" full disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Truck size={16} className="mr-2" />
              Confirmar pedido
            </>
          )}
        </Button>
      ) : (
        <Button type="button" variant="accent" size="lg" full onClick={onNext}>
          Continuar
          <ArrowRight size={16} className="ml-2" />
        </Button>
      )}

      <Button
        type="button"
        variant="outline"
        size="md"
        full
        onClick={() => (isFirstStep ? window.history.back() : onBack())}
        disabled={loading}
      >
        <ArrowLeft size={14} className="mr-1.5" />
        {isFirstStep ? 'Volver al carrito' : 'Paso anterior'}
      </Button>
    </div>
  )
}
