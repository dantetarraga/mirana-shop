'use client'

import type { PaymentAccountData } from '@/features/settings/queries/payment-accounts.queries'
import { Button } from '@/shared/components/ui/Button'
import { formatCurrency } from '@/shared/lib/utils'
import { BadgeCheck, Home, MessageCircle, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { buildWhatsappOrderUrl, formatPhoneDisplay } from '../lib/whatsapp'
import type { SuccessData } from '../types'
import { PaymentAccountsPanel } from './PaymentAccountsPanel'
import { Step } from './ui'

export function SuccessScreen({
  data,
  whatsappPhone,
  accounts,
}: {
  data: SuccessData
  whatsappPhone: string
  accounts: PaymentAccountData[]
}) {
  const whatsappUrl = buildWhatsappOrderUrl(data, whatsappPhone)
  const phoneDisplay = formatPhoneDisplay(whatsappPhone)

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 pt-[calc(var(--nh)+36px)] pb-16">
      <div className="max-w-130 w-full flex flex-col items-center gap-6">
        {/* Icon */}
        <div className="w-20 h-20 bg-(--gold)/10 border border-(--gold)/30 flex items-center justify-center">
          <BadgeCheck size={44} className="text-accent-ink" />
        </div>

        {/* Title */}
        <div className="text-center">
          <p className="text-[10px] tracking-[3px] uppercase text-accent-ink mb-1">
            ¡Pedido recibido!
          </p>
          <h1 className="font-display font-black uppercase text-[30px] tracking-tight leading-none">
            Gracias por tu compra
          </h1>
        </div>

        {/* Order code */}
        <div className="bg-card border border-(--bd) w-full px-6 py-5 text-center">
          <p className="text-[10px] tracking-[3px] uppercase text-muted mb-2">Número de pedido</p>
          <p className="font-display font-black text-[28px] tracking-[3px] text-accent-ink">
            {data.code}
          </p>
          <p className="text-[12px] text-muted mt-1">
            Guarda este código para hacer seguimiento de tu pedido.
          </p>
        </div>

        {/* Resumen de productos */}
        <div className="bg-card border border-(--bd) w-full">
          <div className="px-6 py-4 border-b border-(--bd)">
            <p className="text-[10px] tracking-[3px] uppercase text-accent-ink">Resumen del pedido</p>
          </div>
          <ul className="flex flex-col divide-y divide-(--bd)">
            {data.items.map((item, i) => (
              <li key={i} className="flex justify-between items-center px-6 py-3 gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-[13px] uppercase leading-tight truncate">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-muted">
                    {item.qty} × {formatCurrency(item.unitPrice)}
                  </p>
                </div>
                <span className="font-semibold text-[13px] shrink-0">
                  {formatCurrency(item.unitPrice * item.qty)}
                </span>
              </li>
            ))}
          </ul>
          <div className="px-6 py-4 border-t border-(--bd) flex flex-col gap-2">
            <div className="flex justify-between text-[13px]">
              <span className="text-muted">
                {data.dueTotal > 0 ? 'Subtotal a pagar hoy' : 'Subtotal'}
              </span>
              <span>{formatCurrency(data.subtotal - data.dueTotal)}</span>
            </div>
            {data.dueTotal > 0 && (
              <div className="flex justify-between text-[12px]">
                <span className="text-muted">Valor total del pedido</span>
                <span className="text-muted">{formatCurrency(data.subtotal)}</span>
              </div>
            )}
            {data.discount > 0 && (
              <div className="flex justify-between text-[13px] gap-3">
                <span className="text-muted min-w-0">
                  Descuento{data.discountName ? ` — ${data.discountName}` : ''}
                  {data.couponCode && (
                    <span className="font-mono text-[11px] text-accent-ink">
                      {' '}
                      · {data.couponCode}
                    </span>
                  )}
                </span>
                <span className="text-emerald-400 font-semibold shrink-0">
                  −{formatCurrency(data.discount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-[13px] gap-3">
              <span className="text-muted min-w-0 truncate">{data.deliveryLabel ?? 'Envío'}</span>
              {data.shippingCost === 0 ? (
                <span className="text-emerald-400 font-semibold text-[12px] uppercase shrink-0">
                  Gratis
                </span>
              ) : (
                <span className="shrink-0">{formatCurrency(data.shippingCost)}</span>
              )}
            </div>
            {data.deliveryLocation && (
              <p className="text-[12px] text-muted leading-snug">
                Retiro en: <span className="text-text">{data.deliveryLocation}</span>
              </p>
            )}
            <div className="flex justify-between font-display font-black text-[17px] uppercase tracking-tight border-t border-(--bd) pt-2 mt-1">
              <span>{data.dueTotal > 0 ? 'Pagas hoy' : 'Total pagado'}</span>
              <span className="text-accent-ink">{formatCurrency(data.total)}</span>
            </div>
            {data.dueTotal > 0 && (
              <div className="flex justify-between text-[12px] border border-(--bd) px-3 py-2 mt-1">
                <span className="text-muted">Saldo pendiente de tu preventa</span>
                <span className="text-info font-semibold">{formatCurrency(data.dueTotal)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Próximos pasos — pago manual por WhatsApp */}
        <div className="bg-surf border border-(--bd) w-full px-6 py-5">
          <p className="text-[10px] tracking-[3px] uppercase text-accent-ink mb-3">
            Próximos pasos
          </p>
          <div className="flex flex-col gap-2.5 text-[13px] leading-snug mb-5">
            <Step n={1}>Realiza tu transferencia o depósito al número de cuenta indicado.</Step>
            <Step n={2}>
              Envía tu comprobante de pago por WhatsApp
              {phoneDisplay ? (
                <>
                  {' '}
                  al <span className="font-semibold text-text">{phoneDisplay}</span>
                </>
              ) : null}{' '}
              junto con tu código <span className="font-mono text-accent-ink">{data.code}</span>.
            </Step>
            <Step n={3}>Una vez confirmado el pago, prepararemos y enviaremos tu pedido.</Step>
          </div>

          <PaymentAccountsPanel accounts={accounts} className="mb-5 bg-card" />

          {whatsappPhone && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="block">
              <Button variant="accent" size="md" full>
                <MessageCircle size={15} className="mr-2" />
                Enviar comprobante por WhatsApp
              </Button>
            </a>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link href="/catalogo" className="flex-1">
            <Button variant="accent" size="md" full>
              <ShoppingCart size={15} className="mr-2" />
              Seguir comprando
            </Button>
          </Link>
          <Link href="/" className="flex-1">
            <Button variant="outline" size="md" full>
              <Home size={14} className="mr-2" />
              Ir al inicio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
