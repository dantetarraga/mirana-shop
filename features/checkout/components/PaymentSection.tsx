'use client'

import { PaymentAccountsPanel } from '@/features/checkout/components/PaymentAccountsPanel'
import type { CheckoutInput } from '@/features/checkout/schemas/checkout.schema'
import type { PaymentAccountData } from '@/features/settings/queries/payment-accounts.queries'
import { MessageCircle } from 'lucide-react'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { formatPhoneDisplay } from '../lib/whatsapp'

const PAYMENT_METHODS = [
  {
    value: 'WHATSAPP_TRANSFER',
    label: 'Transferencia / Depósito',
    icon: MessageCircle,
    available: true,
  },
] as const

type Props = {
  register: UseFormRegister<CheckoutInput>
  errors: FieldErrors<CheckoutInput>
  /** Cuentas administradas en /admin/settings */
  accounts: PaymentAccountData[]
  /** Número administrado en /admin/settings */
  whatsappPhone: string
}

export function PaymentSection({ register, errors, accounts, whatsappPhone }: Props) {
  const phoneDisplay = formatPhoneDisplay(whatsappPhone)

  return (
    <section className="bg-card border border-(--bd) p-6">
      <h2 className="font-display font-black uppercase text-[14px] tracking-[2px] text-accent-ink mb-5">
        Método de pago
      </h2>

      <div className="flex flex-col gap-3">
        {PAYMENT_METHODS.map(({ value, label, icon: Icon, available }) => (
          <label
            key={value}
            className={`flex items-start gap-4 border p-4 cursor-pointer transition-colors duration-150 ${
              available
                ? 'border-(--bd) hover:border-(--gold)/60'
                : 'border-(--bd) opacity-45 cursor-not-allowed'
            }`}
          >
            <input
              {...register('paymentMethod')}
              type="radio"
              value={value}
              disabled={!available}
              className="mt-0.5 accent-(--gold) w-4 h-4 shrink-0"
            />
            <Icon size={18} className="mt-0.5 shrink-0 text-accent-ink" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-[14px] uppercase tracking-tight">
                  {label}
                </span>
                {!available && (
                  <span className="text-[9px] tracking-[1.5px] uppercase border border-(--bd) px-1.5 py-0.5 text-muted">
                    Próximamente
                  </span>
                )}
              </div>
              <p className="text-[12px] text-muted mt-0.5 leading-snug">
                Realiza el pago y envíanos tu comprobante por WhatsApp
                {phoneDisplay ? (
                  <>
                    {' '}
                    al <span className="font-semibold text-text">{phoneDisplay}</span>
                  </>
                ) : null}{' '}
                para confirmar tu pedido.
              </p>
            </div>
          </label>
        ))}
      </div>

      {/* Cuentas para transferir — administrables desde el admin */}
      <PaymentAccountsPanel accounts={accounts} className="mt-4 bg-surf" />

      {errors.paymentMethod && (
        <p className="text-red-500 text-[12px] mt-2">{errors.paymentMethod.message}</p>
      )}
    </section>
  )
}
