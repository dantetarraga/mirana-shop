'use client'

import { saveCoupon } from '@/features/coupons/actions/coupon.actions'
import { couponDbSchema, type CouponFormValues } from '@/features/coupons/schemas/coupon.schema'
import type { CouponRow, PromotionOption } from '@/features/coupons/types'
import { AdminDrawer } from '@/shared/components/admin/AdminDrawer'
import { Button } from '@/shared/components/ui/Button'
import { DateField } from '@/shared/components/ui/DateField'
import { FormField } from '@/shared/components/ui/FormField'
import { Select } from '@/shared/components/ui/Select'
import { useFormEntity, useServerAction } from '@/shared/hooks/admin'
import { cls } from '@/shared/lib/admin/admin-classes'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle } from 'lucide-react'
import { useForm } from 'react-hook-form'

const PROMO_TYPE_LABELS: Record<string, string> = {
  FREE_SHIPPING: 'Envío gratis',
  FIXED_DISCOUNT: 'Descuento fijo',
  PERCENT_DISCOUNT: 'Descuento %',
}

const EMPTY_FORM: CouponFormValues = {
  code: '',
  promotionId: '',
  active: true,
  maxUses: undefined,
  startsAt: '',
  endsAt: '',
}

interface Props {
  coupon: CouponRow | null
  isNew: boolean
  promotions: PromotionOption[]
  onClose: () => void
}

export function CouponDrawer({ coupon, isNew, promotions, onClose }: Props) {
  const { isPending, run } = useServerAction()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(couponDbSchema),
    defaultValues: EMPTY_FORM,
  })

  useFormEntity({
    entity: coupon,
    reset,
    defaultValues: EMPTY_FORM,
    mapToForm: (c) => ({
      code: c.code,
      promotionId: c.promotionId,
      active: c.active,
      maxUses: c.maxUses ?? undefined,
      startsAt: c.startsAt ? c.startsAt.toISOString().slice(0, 10) : '',
      endsAt: c.endsAt ? c.endsAt.toISOString().slice(0, 10) : '',
    }),
  })

  const promotionId = watch('promotionId')
  const selected = promotions.find((p) => p.id === promotionId)

  const onSubmit = (data: CouponFormValues) => {
    run(() => saveCoupon(coupon?.id ?? null, data), {
      successMsg: isNew ? 'Cupón creado' : 'Cupón actualizado',
      onSuccess: () => onClose(),
      refresh: true,
    })
  }

  return (
    <AdminDrawer
      title={isNew ? 'Nuevo cupón' : (coupon?.code ?? 'Cupón')}
      sub={isNew ? 'Crear cupón' : 'Editar cupón'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4.5">
        <FormField label="Código" error={errors.code?.message}>
          <input
            {...register('code')}
            className={`${cls.input} font-mono uppercase tracking-[1px]`}
            placeholder="MIRANA10"
            autoCapitalize="characters"
          />
        </FormField>
        <p className="text-[12px] text-muted -mt-2.5">
          Se guarda en mayúsculas. El cliente lo escribe en el checkout sin importar cómo lo teclee.
        </p>

        <FormField label="Promoción que desbloquea" error={errors.promotionId?.message}>
          <Select {...register('promotionId')}>
            <option value="">Selecciona una promoción…</option>
            {promotions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {PROMO_TYPE_LABELS[p.type] ?? p.type}
              </option>
            ))}
          </Select>
        </FormField>

        {selected && !selected.requiresCoupon && (
          <div className="flex items-start gap-2.5 border border-(--bd) p-3 text-[12px]">
            <AlertTriangle size={15} className="mt-0.5 shrink-0 text-(--gold)" />
            <span className="text-muted">
              <span className="text-text font-semibold">«{selected.name}» es automática.</span> Se
              aplica sola a todos los pedidos que cumplan sus condiciones, así que el cupón no
              cambiaría nada. Marca «Solo con cupón» en la promoción para que dependa del código.
            </span>
          </div>
        )}

        <FormField label="Límite de canjes (opcional)" error={errors.maxUses?.message}>
          <input
            {...register('maxUses', { valueAsNumber: true })}
            type="number"
            min={1}
            step={1}
            className={cls.input}
            placeholder="Vacío = ilimitado"
            inputMode="numeric"
          />
        </FormField>
        {!isNew && coupon && (
          <p className="text-[12px] text-muted -mt-2.5">
            Canjeado {coupon.usedCount} {coupon.usedCount === 1 ? 'vez' : 'veces'}
            {coupon.maxUses != null ? ` de ${coupon.maxUses}` : ''}.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <FormField label="Inicio (opcional)" error={errors.startsAt?.message}>
            <DateField {...register('startsAt')} />
          </FormField>
          <FormField label="Fin (opcional)" error={errors.endsAt?.message}>
            <DateField {...register('endsAt')} />
          </FormField>
        </div>
        <p className="text-[12px] text-muted -mt-2.5">
          Además de esta vigencia, el cupón solo funciona mientras su promoción esté activa.
        </p>

        <label className="flex items-center gap-2.5 cursor-pointer text-[13px] select-none">
          <input type="checkbox" {...register('active')} className="accent-(--gold)" />
          Cupón activo
        </label>

        <div className="flex gap-2.5 pt-1">
          <Button type="submit" variant="accent" size="md" full disabled={isPending}>
            {isPending ? 'Guardando...' : isNew ? 'Crear cupón' : 'Guardar cambios'}
          </Button>
          <Button type="button" variant="outline" size="md" full onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </AdminDrawer>
  )
}
