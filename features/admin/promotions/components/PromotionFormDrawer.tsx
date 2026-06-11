'use client'

import type { PromotionRow } from '@/modules/catalog/repositories/promotion.repo'
import { AdminDrawer } from '@/shared/components/admin/AdminDrawer'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { useFormEntity } from '@/shared/hooks/admin'
import { cls } from '@/shared/lib/admin/admin-classes'
import { promotionDbSchema } from '@/shared/lib/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

type FormValues = z.input<typeof promotionDbSchema>

const EMPTY_FORM: FormValues = {
  name: '',
  description: '',
  type: 'FREE_SHIPPING',
  active: true,
  minAmount: undefined,
  discountAmount: undefined,
  discountPercent: undefined,
  startsAt: '',
  endsAt: '',
}

interface Props {
  promotion: PromotionRow | null
  isNew: boolean
  onClose: () => void
  onSubmit: (data: FormValues) => void
  isPending: boolean
}

const TYPE_LABELS: Record<string, string> = {
  FREE_SHIPPING: 'Envío gratis',
  FIXED_DISCOUNT: 'Descuento fijo (S/)',
  PERCENT_DISCOUNT: 'Descuento porcentual (%)',
}

export function PromotionFormDrawer({ promotion, isNew, onClose, onSubmit, isPending }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(promotionDbSchema),
    defaultValues: EMPTY_FORM,
  })

  const type = watch('type')

  useFormEntity({
    entity: promotion,
    reset,
    defaultValues: EMPTY_FORM,
    mapToForm: (p) => ({
      name: p.name,
      description: p.description ?? '',
      type: p.type,
      active: p.active,
      minAmount: p.minAmount ?? undefined,
      discountAmount: p.discountAmount ?? undefined,
      discountPercent: p.discountPercent ?? undefined,
      startsAt: p.startsAt ? p.startsAt.toISOString().slice(0, 10) : '',
      endsAt: p.endsAt ? p.endsAt.toISOString().slice(0, 10) : '',
    }),
  })

  return (
    <AdminDrawer
      title={isNew ? 'Nueva promoción' : (promotion?.name ?? 'Promoción')}
      sub={isNew ? 'Crear promoción' : 'Editar promoción'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4.5">
        <FormField label="Nombre" error={errors.name?.message}>
          <input
            {...register('name')}
            className={cls.input}
            placeholder="Ej: Envío gratis +S/150"
          />
        </FormField>

        <FormField label="Descripción" error={errors.description?.message}>
          <input
            {...register('description')}
            className={cls.input}
            placeholder="Descripción interna opcional"
          />
        </FormField>

        <FormField label="Tipo de promoción" error={errors.type?.message}>
          <select {...register('type')} className={cls.input}>
            {Object.entries(TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </FormField>

        {/* Monto mínimo — aplica a todos los tipos */}
        <FormField label="Monto mínimo de compra (S/)" error={errors.minAmount?.message}>
          <input
            {...register('minAmount', { valueAsNumber: true })}
            type="number"
            min={0}
            step="0.01"
            className={cls.input}
            placeholder="Ej: 150"
          />
        </FormField>

        {/* Descuento fijo */}
        {type === 'FIXED_DISCOUNT' && (
          <FormField label="Monto de descuento (S/)" error={errors.discountAmount?.message}>
            <input
              {...register('discountAmount', { valueAsNumber: true })}
              type="number"
              min={0}
              step="0.01"
              className={cls.input}
              placeholder="Ej: 20"
            />
          </FormField>
        )}

        {/* Descuento porcentual */}
        {type === 'PERCENT_DISCOUNT' && (
          <FormField label="Porcentaje de descuento (%)" error={errors.discountPercent?.message}>
            <input
              {...register('discountPercent', { valueAsNumber: true })}
              type="number"
              min={1}
              max={100}
              step="1"
              className={cls.input}
              placeholder="Ej: 15"
            />
          </FormField>
        )}

        <div className="grid grid-cols-2 gap-3.5">
          <FormField label="Inicio (opcional)" error={errors.startsAt?.message}>
            <input {...register('startsAt')} type="date" className={cls.input} />
          </FormField>
          <FormField label="Fin (opcional)" error={errors.endsAt?.message}>
            <input {...register('endsAt')} type="date" className={cls.input} />
          </FormField>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <input
            id="promo-active"
            type="checkbox"
            {...register('active')}
            className="w-4 h-4 accent-(--gold)"
          />
          <label htmlFor="promo-active" className={cls.label}>
            Promoción activa
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" variant="accent" size="md" full disabled={isPending}>
            {isPending ? 'Guardando...' : isNew ? 'Crear promoción' : 'Guardar cambios'}
          </Button>
          <Button type="button" variant="outline" size="md" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
        </div>
      </form>
    </AdminDrawer>
  )
}
