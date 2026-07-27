'use client'

import { depositUnitPrice, type PreorderMode } from '@/features/checkout/lib/preorder'
import { effectivePrice } from '@/features/checkout/lib/pricing'
import { Button } from '@/shared/components/ui/Button'
import { formatCurrency } from '@/shared/lib/utils'
import { ArrowLeft, Loader2, Truck } from 'lucide-react'
import Image from 'next/image'

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
  total: number
  loading: boolean
  /** null = no hay promoción de envío gratis activa */
  shippingThreshold: number | null
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
  total,
  loading,
  shippingThreshold,
}: Props) {
  return (
    <div className="lg:sticky lg:top-6 flex flex-col gap-4">
      <div className="bg-card border border-(--bd) p-6">
        <h2 className="font-display font-black uppercase text-[13px] tracking-[2px] text-accent-ink mb-4">
          Resumen del pedido
        </h2>

        {/* Items */}
        <ul className="flex flex-col gap-3 mb-5 max-h-64 overflow-y-auto pr-1">
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

        {/* Totals */}
        <div className="border-t border-(--bd) pt-4 flex flex-col gap-2">
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
            <div className="flex justify-between text-[13px]">
              <span className="text-muted">Descuento{discountName ? ` — ${discountName}` : ''}</span>
              <span className="text-emerald-400 font-semibold">
                −{formatCurrency(discount)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-[13px]">
            <span className="text-muted">Envío</span>
            {shippingFree ? (
              <span className="text-emerald-400 font-semibold text-[12px] uppercase tracking-wide">
                Gratis
              </span>
            ) : (
              <span>{formatCurrency(shippingCost)}</span>
            )}
          </div>

          {!shippingFree && shippingThreshold != null && (
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

      {/* CTA */}
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

      <Button
        type="button"
        variant="outline"
        size="md"
        full
        onClick={() => window.history.back()}
        disabled={loading}
      >
        <ArrowLeft size={14} className="mr-1.5" />
        Volver al carrito
      </Button>
    </div>
  )
}
