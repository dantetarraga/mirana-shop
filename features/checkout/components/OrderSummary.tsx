'use client'

import { Button } from '@/shared/components/ui/Button'
import { formatCurrency } from '@/shared/lib/utils'
import { ArrowLeft, Loader2, Truck } from 'lucide-react'

type CartItem = {
  product: {
    id: string
    name: string
    imageUrl: string | null
    price: number
  }
  qty: number
}

type Props = {
  cart: CartItem[]
  subtotal: number
  shippingCost: number
  shippingFree: boolean
  total: number
  loading: boolean
  shippingThreshold: number
}

export function OrderSummary({
  cart,
  subtotal,
  shippingCost,
  shippingFree,
  total,
  loading,
  shippingThreshold,
}: Props) {
  return (
    <div className="lg:sticky lg:top-6 flex flex-col gap-4">
      <div className="bg-card border border-(--bd) p-6">
        <h2 className="font-display font-black uppercase text-[13px] tracking-[2px] text-(--gold) mb-4">
          Resumen del pedido
        </h2>

        {/* Items */}
        <ul className="flex flex-col gap-3 mb-5 max-h-64 overflow-y-auto pr-1">
          {cart.map((item) => (
            <li key={item.product.id} className="flex gap-3 items-start">
              <div className="w-12 h-12 bg-surf border border-(--bd) shrink-0 overflow-hidden">
                {item.product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
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
                  {item.qty} × {formatCurrency(item.product.price)}
                </p>
              </div>
              <span className="font-semibold text-[13px] shrink-0">
                {formatCurrency(item.product.price * item.qty)}
              </span>
            </li>
          ))}
        </ul>

        {/* Totals */}
        <div className="border-t border-(--bd) pt-4 flex flex-col gap-2">
          <div className="flex justify-between text-[13px]">
            <span className="text-muted">Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>

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

          {!shippingFree && (
            <p className="text-[11px] text-muted leading-snug">
              Agrega{' '}
              <span className="text-white font-semibold">
                {formatCurrency(shippingThreshold - subtotal)}
              </span>{' '}
              más para envío gratis.
            </p>
          )}

          <div className="flex justify-between font-display font-black text-[18px] uppercase tracking-tight border-t border-(--bd) pt-3 mt-1">
            <span>Total</span>
            <span className="text-(--gold)">{formatCurrency(total)}</span>
          </div>
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
