'use client'

import { PaymentAccountsPanel } from '@/features/checkout/components/PaymentAccountsPanel'
import type { CheckoutInput } from '@/features/checkout/schemas/checkout.schema'
import type { PaymentAccountData } from '@/features/settings/queries/payment-accounts.queries'
import { MessageCircle } from 'lucide-react'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { formatPhoneDisplay } from '../lib/whatsapp'
import { sectionCard, sectionLead, sectionTitle } from './ui'

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
    <section className={sectionCard} aria-labelledby="payment-title">
      <h2 id="payment-title" className={sectionTitle}>
        Pago
      </h2>
      <p className={sectionLead}>
        No se cobra nada al confirmar: pagas después, por transferencia o depósito.
      </p>

      <div className="flex flex-col gap-2.5 mt-6">
        {PAYMENT_METHODS.map(({ value, label, icon: Icon, available }) => (
          <label
            key={value}
            className={`flex items-start gap-3.5 border p-4 transition-colors duration-150 ${
              available
                ? 'border-(--gold) bg-(--sub) cursor-pointer'
                : 'border-(--bd) opacity-45 cursor-not-allowed'
            }`}
          >
            <input
              {...register('paymentMethod')}
              type="radio"
              value={value}
              disabled={!available}
              className="mt-0.5 accent-accent-ink size-5 shrink-0"
            />
            <Icon size={18} className="hidden sm:block mt-0.5 shrink-0 text-accent-ink" aria-hidden />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[15px] leading-5 font-semibold text-text">{label}</span>
                {!available && (
                  <span className="text-[12px] border border-(--bd) px-1.5 py-0.5 text-muted">
                    Próximamente
                  </span>
                )}
              </div>
              <ol className="text-[13px] text-muted mt-2 leading-snug flex flex-col gap-1 list-decimal pl-4 marker:text-muted">
                <li>Confirma tu pedido y anota el código que te damos.</li>
                <li>
                  Transfiere o deposita el total
                  {accounts.length > 0 ? ' a una de las cuentas de abajo.' : ' según te indiquemos por WhatsApp.'}
                </li>
                <li>
                  Envía el comprobante por WhatsApp
                  {phoneDisplay ? (
                    <>
                      {' '}
                      al <span className="font-semibold text-text whitespace-nowrap">{phoneDisplay}</span>
                    </>
                  ) : null}
                  . Con eso confirmamos tu pedido.
                </li>
              </ol>
            </div>
          </label>
        ))}
      </div>

      {/* Cuentas para transferir — administrables desde el admin */}
      <PaymentAccountsPanel accounts={accounts} className="mt-4 bg-surf" />

      {errors.paymentMethod && (
        <p role="alert" className="text-danger text-[13px] mt-3">{errors.paymentMethod.message}</p>
      )}
    </section>
  )
}
