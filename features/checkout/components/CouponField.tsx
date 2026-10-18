'use client'

import type { AppliedCoupon } from '@/features/checkout/lib/pricing'
import { isCouponEligible } from '@/features/checkout/lib/pricing'
import { applyCoupon } from '@/features/coupons/actions/apply-coupon.actions'
import { Button } from '@/shared/components/ui/Button'
import { cn, formatCurrency } from '@/shared/lib/utils'
import { Check, Ticket, X } from 'lucide-react'
import { useId, useState } from 'react'
import { toast } from 'sonner'
import { fieldLabel, input } from './ui'

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
//
// Vive dentro del resumen del pedido: es donde el cliente mira el total, así
// que es donde espera poder canjear el código y ver el efecto al instante.
// ---------------------------------------------------------------------------

export function CouponField({ coupon, onApply, onRemove, subtotal, disabled }: Props) {
  const [code, setCode] = useState('')
  const [checking, setChecking] = useState(false)
  const inputId = useId()

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
    <div className="border-t border-(--bd) pt-5 mt-5">
      {coupon ? (
        <>
          <p className={fieldLabel}>Cupón de descuento</p>
          <div className="flex items-center gap-3 border border-(--bd) bg-surf pl-3 min-h-12">
            <Ticket size={16} className="shrink-0 text-accent-ink" aria-hidden />
            <div className="flex-1 min-w-0 py-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-[14px] tracking-[1px]">{coupon.code}</span>
                {eligible && <Check size={14} className="text-success shrink-0" aria-hidden />}
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
              size="md"
              title="Quitar cupón"
              aria-label={`Quitar cupón ${coupon.code}`}
              onClick={onRemove}
              disabled={disabled}
            >
              <X size={16} aria-hidden />
            </Button>
          </div>
        </>
      ) : (
        <>
          <label htmlFor={inputId} className={fieldLabel}>
            Cupón de descuento
          </label>
          <div className="flex gap-2">
            <input
              id={inputId}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                // El checkout es un solo <form>: sin esto, Enter enviaría el pedido.
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void submit()
                }
              }}
              className={cn(input, 'font-mono uppercase tracking-[1px] placeholder:normal-case placeholder:tracking-normal placeholder:font-sans')}
              placeholder="Ingresa tu código"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              disabled={disabled || checking}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={submit}
              disabled={disabled || !code.trim()}
              loading={checking}
              loadingText="Validando cupón…"
              className="shrink-0 h-12"
            >
              Aplicar
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
