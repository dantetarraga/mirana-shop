'use client'

import {
  depositUnitPrice,
  resolveDepositPercent,
  type PreorderMode,
} from '@/features/checkout/lib/preorder'
import { effectivePrice } from '@/features/checkout/lib/pricing'
import { FadeImage } from '@/shared/components/ui/FadeImage'
import { cn, formatCurrency } from '@/shared/lib/utils'
import { ChevronDown } from 'lucide-react'
import { itemCountLabel } from './checkout-layout'
import { useId, useState, type ReactNode } from 'react'

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

/** Números del resumen: lo que se muestra, ya calculado por quien lo usa. */
export type OrderSummaryData = {
  lines: CartItem[]
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
  /** null = no hay promoción de envío gratis activa */
  shippingThreshold: number | null
  /** Nombre de la forma de entrega elegida, para el desglose */
  deliveryLabel: string | null
}

type Props = {
  summary: OrderSummaryData
  /** Campo de cupón — se canjea acá, junto al total que modifica */
  couponSlot?: ReactNode
  className?: string
}

/**
 * Resumen del pedido: solo presenta líneas y totales. Lo que depende del paso
 * (términos, avanzar, confirmar) lo decide CheckoutView y va fuera de la
 * tarjeta, para poder reubicarlo en móvil.
 *
 * En móvil la tarjeta es un acordeón cerrado ("Ver resumen · S/ X") arriba del
 * formulario; desde `lg` queda siempre abierta en la columna fija.
 */
export function OrderSummary({ summary, couponSlot, className }: Props) {
  const {
    lines: cart,
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
    shippingThreshold,
    deliveryLabel,
  } = summary
  const [open, setOpen] = useState(false)
  const bodyId = useId()
  const itemCount = cart.reduce((s, i) => s + i.qty, 0)
  // Un método de retiro cuesta 0 sin que exista promoción de envío gratis: en
  // ambos casos al cliente hay que decirle "Gratis", no "S/ 0.00".
  const shippingIsFree = shippingFree || shippingCost === 0
  const totalLabel = dueTotal > 0 ? 'Pagas hoy' : 'Total'

  return (
    <section aria-labelledby={`${bodyId}-title`} className={cn('bg-card border border-(--bd)', className)}>
      {/* Cabecera móvil: abre/cierra el resumen */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={bodyId}
        className="lg:hidden w-full h-14 px-4 flex items-center gap-3 text-left cursor-pointer"
      >
        <span className="flex-1 min-w-0">
          <span className="block text-[14px] leading-5 font-semibold text-text">
            {open ? 'Ocultar resumen' : 'Ver resumen'}
          </span>
          <span className="block text-[12px] leading-4 text-muted">{itemCountLabel(itemCount)}</span>
        </span>
        <span className="font-display font-black text-[22px] leading-none text-accent-ink">
          {formatCurrency(total)}
        </span>
        <ChevronDown
          size={18}
          aria-hidden
          className={cn('shrink-0 text-muted transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      <div
        id={bodyId}
        className={cn('px-4 pb-5 sm:px-6 lg:p-6 border-t border-(--bd) lg:border-t-0', !open && 'max-lg:hidden')}
      >
        <div className="hidden lg:flex items-center justify-between gap-3 mb-5 h-5.5">
          <h2 id={`${bodyId}-title`} className="font-display font-black uppercase text-[22px] leading-none tracking-tight">
            Resumen del pedido
          </h2>
          <span className="text-[13px] leading-5 text-muted shrink-0">{itemCountLabel(itemCount)}</span>
        </div>
        {/* En móvil el título visible es el botón; el h2 queda para lectores */}
        <h2 className="sr-only lg:hidden">Resumen del pedido</h2>

        {/* Líneas */}
        <ul className="flex flex-col gap-4 pt-4 lg:pt-0 lg:max-h-[min(40vh,320px)] lg:overflow-y-auto lg:-mr-2 lg:pr-2">
          {cart.map((item) => (
            <SummaryLine key={item.product.id} item={item} depositPercent={depositPercent} />
          ))}
        </ul>

        {/* Cupón — antes de los totales, que es lo que modifica */}
        {couponSlot}

        {/* Totales */}
        <dl className="border-t border-(--bd) pt-5 mt-5 flex flex-col gap-2.5 text-[14px] leading-5">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">{dueTotal > 0 ? 'Subtotal a pagar hoy' : 'Subtotal'}</dt>
            <dd className="font-medium tabular-nums">{formatCurrency(payableNow)}</dd>
          </div>

          {dueTotal > 0 && (
            <div className="flex justify-between gap-3 text-[13px]">
              <dt className="text-muted">Valor total del pedido</dt>
              <dd className="text-muted tabular-nums">{formatCurrency(subtotal)}</dd>
            </div>
          )}

          {discount > 0 && (
            <div className="flex justify-between gap-3">
              <dt className="text-muted min-w-0">
                Descuento{discountName ? `: ${discountName}` : ''}
                {couponCode && (
                  <span className="ml-1.5 font-mono text-[12px] text-accent-ink">{couponCode}</span>
                )}
              </dt>
              <dd className="text-success font-semibold shrink-0 tabular-nums">
                −{formatCurrency(discount)}
              </dd>
            </div>
          )}

          <div className="flex justify-between gap-3">
            <dt className="text-muted min-w-0">{deliveryLabel ?? 'Envío'}</dt>
            {shippingIsFree ? (
              <dd className="text-success font-semibold shrink-0">Gratis</dd>
            ) : (
              <dd className="font-medium shrink-0 tabular-nums">{formatCurrency(shippingCost)}</dd>
            )}
          </div>

          {!shippingIsFree && shippingThreshold != null && shippingThreshold > payableNow && (
            <p className="text-[12px] text-muted leading-snug">
              Agrega{' '}
              <span className="text-text font-semibold">
                {formatCurrency(shippingThreshold - payableNow)}
              </span>{' '}
              más para envío gratis.
            </p>
          )}

          <div className="flex justify-between items-end gap-3 border-t border-(--bd) pt-4 mt-1.5">
            <dt className="text-[16px] font-semibold text-text">{totalLabel}</dt>
            <dd className="font-display font-black text-[30px] leading-none tracking-tight text-accent-ink tabular-nums">
              {formatCurrency(total)}
            </dd>
          </div>

          {dueTotal > 0 && (
            <div className="flex justify-between gap-3 text-[13px] bg-surf border border-(--bd) px-3 py-2.5 mt-1">
              <dt className="text-muted">Saldo pendiente de tu preventa</dt>
              <dd className="text-info font-semibold tabular-nums">{formatCurrency(dueTotal)}</dd>
            </div>
          )}
        </dl>
      </div>
    </section>
  )
}

function SummaryLine({ item, depositPercent }: { item: CartItem; depositPercent: number }) {
  const { product, qty } = item
  const isPreorder = product.status === 'PREORDER'
  const isPartial = item.preorderMode === 'PARTIAL'
  // En las líneas parciales se muestra el adelanto: es lo que suma al total
  // que el cliente va a pagar hoy.
  const fullUnit = effectivePrice(product)
  const unit = isPartial ? depositUnitPrice(product, depositPercent) : fullUnit

  return (
    <li className="flex gap-3 items-start">
      <div className="relative size-16 shrink-0 overflow-hidden bg-skeleton border border-(--bd)">
        {product.imageUrl ? (
          <FadeImage src={product.imageUrl} alt="" fill sizes="64px" className="object-cover" />
        ) : (
          <div className="w-full h-full stripe-fig" />
        )}
        {qty > 1 && (
          <span
            aria-hidden
            className="absolute top-0 right-0 min-w-5 h-5 px-1 bg-(--brand-navy) text-on-media text-[11px] font-bold flex items-center justify-center"
          >
            {qty}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[14px] leading-5 font-semibold text-text line-clamp-2">{product.name}</p>
        <p className="text-[13px] leading-5 text-muted mt-0.5 tabular-nums">
          {qty} × {formatCurrency(unit)}
        </p>
        {isPreorder && (
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] leading-4">
            <span className="inline-flex items-center h-5 px-1.5 border border-info/40 text-info font-semibold">
              Preventa
            </span>
            {isPartial && (
              <span className="text-muted">
                Adelanto del {resolveDepositPercent(product, depositPercent)} % de{' '}
                {formatCurrency(fullUnit)}
              </span>
            )}
          </p>
        )}
      </div>

      <span className="text-[14px] leading-5 font-semibold shrink-0 tabular-nums">
        {formatCurrency(unit * qty)}
      </span>
    </li>
  )
}
