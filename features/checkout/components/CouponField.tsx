'use client'

import type { AppliedCoupon } from '@/features/checkout/lib/pricing'
import { isCouponEligible } from '@/features/checkout/lib/pricing'
import { applyCoupon } from '@/features/coupons/actions/apply-coupon.actions'
import { Button } from '@/shared/components/ui/Button'
import { formatCurrency } from '@/shared/lib/utils'
import { Check, Loader2, Ticket, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { input } from './ui'

type Props = {
  coupon: AppliedCoupon | null
  onApply: (coupon: AppliedCoupon) => void
  onRemove: () => void
  /** Subtotal a pagar hoy — para avisar si falta llegar al mínimo */
  subtotal: number
  disabled?: boolean
}

// ---------------------------------------------------------------------------
// Cupón de descuento. La validación real la hace el servidor: acá solo se
// consulta para poder mostrar el total ya con el beneficio aplicado.
// ---------------------------------------------------------------------------

export function CouponField({ coupon, onApply, onRemove, subtotal, disabled }: Props) {
  const [code, setCode] = useState('')
  const [checking, setChecking] = useState(false)

  const submit = async () => {
    if (checking || !code.trim()) return
    setChecking(true)
    const result = await applyCoupon(code)
    setChecking(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    onApply(result.data)
    setCode('')
    toast.success(`Cupón ${result.data.code} aplicado`)
  }

  const eligible = coupon != null && isCouponEligible(coupon, subtotal)

  return (
    <section className="bg-card border border-(--bd) p-6">
      <h2 className="font-display font-black uppercase text-[14px] tracking-[2px] text-accent-ink mb-5">
        Cupón de descuento
      </h2>

      {coupon ? (
        <div className="flex items-start gap-3 border border-(--bd) bg-surf px-4 py-3">
          <Ticket size={16} className="mt-0.5 shrink-0 text-accent-ink" aria-hidden />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[14px] tracking-[1px]">{coupon.code}</span>
              {eligible && <Check size={14} className="text-emerald-400 shrink-0" aria-hidden />}
            </div>
            <p className="text-[12px] text-muted mt-0.5 leading-snug">
              {eligible ? (
                coupon.name
              ) : (
                <>
                  Agrega{' '}
                  <span className="text-text font-semibold">
                    {formatCurrency((coupon.minAmount ?? 0) - subtotal)}
                  </span>{' '}
                  más para usar este cupón.
                </>
              )}
            </p>
          </div>
          <Button
            type="button"
            variant="icon"
            size="sm"
            title="Quitar cupón"
            aria-label="Quitar cupón"
            onClick={onRemove}
            disabled={disabled}
          >
            <X size={14} />
          </Button>
        </div>
      ) : (
        <div className="flex gap-2.5">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              // El checkout es un solo <form>: sin esto, Enter enviaría el pedido.
              if (e.key === 'Enter') {
                e.preventDefault()
                void submit()
              }
            }}
            className={`${input} font-mono uppercase tracking-[1px]`}
            placeholder="MIRANA10"
            aria-label="Código de cupón"
            autoComplete="off"
            disabled={disabled || checking}
          />
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={submit}
            disabled={disabled || checking || !code.trim()}
          >
            {checking ? <Loader2 size={14} className="animate-spin" /> : 'Aplicar'}
          </Button>
        </div>
      )}
    </section>
  )
}
