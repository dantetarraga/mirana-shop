'use client'

import type { CheckoutInput } from '@/shared/lib/schemas'
import { MessageCircle } from 'lucide-react'
// import { CreditCard, Smartphone } from 'lucide-react' // próximamente
import type { FieldErrors, UseFormRegister } from 'react-hook-form'

const PAYMENT_METHODS = [
  {
    value: 'WHATSAPP_TRANSFER',
    label: 'Transferencia / Depósito',
    desc: 'Realiza el pago y envíanos tu comprobante por WhatsApp para confirmar tu pedido.',
    icon: MessageCircle,
    available: true,
  },
  // {
  //   value: 'CULQI_YAPE',
  //   label: 'Yape',
  //   desc: 'Pago con Yape escaneando el código QR.',
  //   icon: Smartphone,
  //   available: true,
  // },
  // {
  //   value: 'CULQI_CARD',
  //   label: 'Tarjeta de crédito / débito',
  //   desc: 'Visa, Mastercard — pago seguro con Culqi.',
  //   icon: CreditCard,
  //   available: true,
  // },
] as const

export type CardState = {
  cardNumber: string
  cardExpiry: string
  cardCvv: string
  cardError: string | null
  setCardNumber: (v: string) => void
  setCardExpiry: (v: string) => void
  setCardCvv: (v: string) => void
  setCardError: (v: string | null) => void
}

type Props = {
  register: UseFormRegister<CheckoutInput>
  errors: FieldErrors<CheckoutInput>
  selectedPayment: string
  card: CardState
}

const cardInput =
  'bg-transparent border border-(--bd) px-3 py-2 text-[13px] focus:outline-none focus:border-(--gold)/60 tracking-widest'

export function PaymentSection({ register, errors, selectedPayment, card }: Props) {
  return (
    <section className="bg-card border border-(--bd) p-6">
      <h2 className="font-display font-black uppercase text-[14px] tracking-[2px] text-(--gold) mb-5">
        Método de pago
      </h2>

      <div className="flex flex-col gap-3">
        {PAYMENT_METHODS.map(({ value, label, desc, icon: Icon, available }) => (
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
            <Icon size={18} className="mt-0.5 shrink-0 text-(--gold)" />
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
              <p className="text-[12px] text-muted mt-0.5 leading-snug">{desc}</p>
            </div>
          </label>
        ))}
      </div>

      {errors.paymentMethod && (
        <p className="text-red-500 text-[12px] mt-2">{errors.paymentMethod.message}</p>
      )}

      {/* Formulario de tarjeta — próximamente */}
      {/* selectedPayment === 'CULQI_CARD' && (
        <div className="mt-4 bg-surf border border-(--bd) p-4 flex flex-col gap-4">
          <p className="text-[10px] tracking-[3px] uppercase text-(--gold)">Datos de tarjeta</p>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase tracking-[1.5px] text-muted">
              Número de tarjeta
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={19}
              placeholder="0000 0000 0000 0000"
              value={card.cardNumber}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '').slice(0, 16)
                card.setCardNumber(raw.replace(/(.{4})/g, '$1 ').trim())
                card.setCardError(null)
              }}
              className={cardInput}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-[1.5px] text-muted">MM / AA</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={5}
                placeholder="MM/AA"
                value={card.cardExpiry}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 4)
                  const formatted = raw.length > 2 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw
                  card.setCardExpiry(formatted)
                  card.setCardError(null)
                }}
                className={cardInput}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-[1.5px] text-muted">CVV</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="123"
                value={card.cardCvv}
                onChange={(e) => {
                  card.setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))
                  card.setCardError(null)
                }}
                className={cardInput}
              />
            </div>
          </div>

          {card.cardError && <p className="text-red-500 text-[12px]">{card.cardError}</p>}
        </div>
      ) */}
    </section>
  )
}
