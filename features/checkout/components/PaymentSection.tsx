'use client'

import type { CheckoutInput } from '@/features/checkout/schemas/checkout.schema'
import type { PaymentAccountData } from '@/features/settings/queries/payment-accounts.queries'
import { Copy, Landmark, MessageCircle } from 'lucide-react'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { toast } from 'sonner'

const PAYMENT_METHODS = [
  {
    value: 'WHATSAPP_TRANSFER',
    label: 'Transferencia / Depósito',
    desc: 'Realiza el pago y envíanos tu comprobante por WhatsApp para confirmar tu pedido.',
    icon: MessageCircle,
    available: true,
  },
] as const

type Props = {
  register: UseFormRegister<CheckoutInput>
  errors: FieldErrors<CheckoutInput>
  /** Cuentas administradas en /admin/settings */
  accounts: PaymentAccountData[]
}

function CopyValue({ label, value }: { label: string; value: string }) {
  return (
    <button
      type="button"
      title={`Copiar ${label.toLowerCase()}`}
      onClick={() => {
        navigator.clipboard
          .writeText(value)
          .then(() => toast.success(`${label} copiado`))
          .catch(() => {})
      }}
      className="inline-flex items-center gap-1.5 font-mono text-[13px] text-text hover:text-(--gold) transition-colors cursor-pointer"
    >
      {value}
      <Copy size={12} className="opacity-50" />
    </button>
  )
}

export function PaymentSection({ register, errors, accounts }: Props) {
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

      {/* Cuentas para transferir — administrables desde el admin */}
      {accounts.length > 0 && (
        <div className="mt-4 border border-(--bd) bg-surf">
          <div className="px-4 py-3 border-b border-(--bd) flex items-center gap-2">
            <Landmark size={14} className="text-(--gold)" />
            <span className="text-[10px] tracking-[2px] uppercase text-muted">
              Cuentas para realizar tu pago
            </span>
          </div>
          <ul className="divide-y divide-(--bd)">
            {accounts.map((acc) => (
              <li key={acc.id} className="px-4 py-3 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-[13px] uppercase tracking-tight">
                    {acc.name}
                  </span>
                  {acc.holder && <span className="text-[11px] text-muted">— {acc.holder}</span>}
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1">
                  <span className="text-[11px] text-muted">
                    {acc.cci ? 'Cuenta: ' : 'Número: '}
                    <CopyValue label="Número" value={acc.number} />
                  </span>
                  {acc.cci && (
                    <span className="text-[11px] text-muted">
                      CCI: <CopyValue label="CCI" value={acc.cci} />
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {errors.paymentMethod && (
        <p className="text-red-500 text-[12px] mt-2">{errors.paymentMethod.message}</p>
      )}
    </section>
  )
}
