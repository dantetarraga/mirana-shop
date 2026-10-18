'use client'

import type { PaymentAccountData } from '@/features/settings/queries/payment-accounts.queries'
import { Button, buttonClass } from '@/shared/components/ui/Button'
import { useUser } from '@/shared/hooks/useUser'
import { formatCurrency } from '@/shared/lib/utils'
import { BadgeCheck, Check, Copy, MessageCircle, Package, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
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
  const { user } = useUser()
  const [copied, setCopied] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  // El formulario desaparece y el foco quedaría en <body> a mitad de página:
  // se sube al inicio y se enfoca el título para que el lector anuncie el éxito.
  useEffect(() => {
    window.scrollTo({ top: 0 })
    headingRef.current?.focus()
  }, [])

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(data.code)
      setCopied(true)
      toast.success('Código copiado')
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('No se pudo copiar. Selecciona el código y cópialo manualmente.')
    }
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 pt-9 pb-16">
      <div className="max-w-130 w-full flex flex-col items-center gap-6">
        {/* Icon */}
        <div className="w-20 h-20 bg-(--gold)/10 border border-(--gold)/30 flex items-center justify-center">
          <BadgeCheck size={44} className="text-accent-ink" aria-hidden />
        </div>

        {/* Title */}
        <div className="text-center">
          <h1
            ref={headingRef}
            tabIndex={-1}
            data-focus-target
            className="font-display font-black uppercase text-[32px] sm:text-[36px] tracking-tight leading-none outline-none"
          >
            Recibimos tu pedido
          </h1>
          <p className="text-[15px] leading-6 text-muted mt-3 max-w-100 mx-auto">
            Aún no está pagado. Sigue los pasos de abajo para que lo preparemos.
          </p>
        </div>

        {/* Order code */}
        <div className="bg-card border border-(--bd) w-full px-6 py-5 text-center">
          <p className="text-[13px] font-semibold text-muted mb-1">Código de pedido</p>
          <div className="flex items-center justify-center gap-2">
            <p className="font-display font-black text-[28px] tracking-[3px] text-accent-ink select-all">
              {data.code}
            </p>
            <Button
              type="button"
              variant="icon"
              size="md"
              onClick={copyCode}
              aria-label={copied ? 'Código copiado' : `Copiar código de pedido ${data.code}`}
            >
              {copied ? (
                <Check size={16} className="text-success" aria-hidden />
              ) : (
                <Copy size={16} aria-hidden />
              )}
            </Button>
          </div>
          <p className="text-[13px] text-muted mt-1">
            Guárdalo: lo necesitas para enviar el comprobante y hacer seguimiento.
          </p>
        </div>

        {/* Próximos pasos — pago manual por WhatsApp */}
        <div className="bg-surf border border-(--bd) w-full px-5 sm:px-6 py-5">
          <h2 className="font-display font-black uppercase text-[22px] leading-none tracking-tight mb-4">
            Próximos pasos
          </h2>
          <ol className="flex flex-col gap-3 text-[14px] leading-snug mb-5">
            <Step n={1}>
              Realiza tu transferencia o depósito
              {accounts.length > 0
                ? ' a una de las cuentas de abajo.'
                : ' según te indiquemos por WhatsApp.'}
            </Step>
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
          </ol>

          <PaymentAccountsPanel accounts={accounts} className="mb-5 bg-card" />

          {/* CTA dominante de la pantalla: sin el comprobante el pedido no avanza. */}
          {whatsappPhone && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass({ variant: 'whatsapp', size: 'lg', full: true })}
            >
              <MessageCircle size={18} aria-hidden />
              Enviar comprobante por WhatsApp
              <span className="sr-only"> (se abre en una pestaña nueva)</span>
            </a>
          )}
        </div>

        {/* Resumen de productos */}
        <div className="bg-card border border-(--bd) w-full">
          <div className="px-5 sm:px-6 py-4 border-b border-(--bd)">
            <h2 className="font-display font-black uppercase text-[22px] leading-none tracking-tight">
              Resumen del pedido
            </h2>
          </div>
          <ul className="flex flex-col divide-y divide-(--bd)">
            {data.items.map((item, i) => (
              <li key={`${item.name}-${i}`} className="flex justify-between items-start px-5 sm:px-6 py-3 gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] leading-5 font-semibold line-clamp-2">{item.name}</p>
                  <p className="text-[13px] text-muted tabular-nums">
                    {item.qty} × {formatCurrency(item.unitPrice)}
                  </p>
                </div>
                <span className="font-semibold text-[14px] leading-5 shrink-0 tabular-nums">
                  {formatCurrency(item.unitPrice * item.qty)}
                </span>
              </li>
            ))}
          </ul>
          <div className="px-5 sm:px-6 py-4 border-t border-(--bd) flex flex-col gap-2.5 text-[14px]">
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
                  Descuento{data.discountName ? `: ${data.discountName}` : ''}
                  {data.couponCode && (
                    <span className="ml-1.5 font-mono text-[12px] text-accent-ink">
                      {data.couponCode}
                    </span>
                  )}
                </span>
                <span className="text-success font-semibold shrink-0">
                  −{formatCurrency(data.discount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-[13px] gap-3">
              <span className="text-muted min-w-0 truncate">{data.deliveryLabel ?? 'Envío'}</span>
              {data.shippingCost === 0 ? (
                <span className="text-success font-semibold shrink-0">
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
            <div className="flex justify-between items-end border-t border-(--bd) pt-3 mt-1">
              <span className="text-[16px] font-semibold">
                {data.dueTotal > 0 ? 'Por pagar hoy' : 'Total por pagar'}
              </span>
              <span className="font-display font-black text-[28px] leading-none tracking-tight text-accent-ink tabular-nums">
                {formatCurrency(data.total)}
              </span>
            </div>
            {data.dueTotal > 0 && (
              <div className="flex justify-between text-[12px] border border-(--bd) px-3 py-2 mt-1">
                <span className="text-muted">Saldo pendiente de tu preventa</span>
                <span className="text-info font-semibold">{formatCurrency(data.dueTotal)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Acciones secundarias — no compiten con el CTA de WhatsApp */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          {user && (
            <Link
              href="/cuenta/pedidos"
              className={buttonClass({ variant: 'outline', size: 'md', className: 'flex-1' })}
            >
              <Package size={15} aria-hidden />
              Ver mis pedidos
            </Link>
          )}
          <Link
            href="/catalogo"
            className={buttonClass({ variant: 'ghost', size: 'md', className: 'flex-1' })}
          >
            <ShoppingCart size={15} aria-hidden />
            Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  )
}
