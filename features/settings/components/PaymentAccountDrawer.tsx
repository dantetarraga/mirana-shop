'use client'

import { savePaymentAccount } from '@/features/settings/actions/payment-accounts.actions'
import type { PaymentAccountData } from '@/features/settings/queries/payment-accounts.queries'
import { AdminDrawer } from '@/shared/components/admin/AdminDrawer'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { useFormEntity, useServerAction } from '@/shared/hooks/admin'
import { cls } from '@/shared/lib/admin/admin-classes'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const formSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(60),
  holder: z.string().max(80).optional(),
  number: z.string().min(1, 'Número requerido').max(40),
  cci: z.string().max(40).optional(),
  active: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

const DEFAULTS: FormValues = { name: '', holder: '', number: '', cci: '', active: true }

interface PaymentAccountDrawerProps {
  account: PaymentAccountData | null
  isNew: boolean
  onClose: () => void
}

export function PaymentAccountDrawer({ account, isNew, onClose }: PaymentAccountDrawerProps) {
  const { isPending, run } = useServerAction()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULTS,
  })

  useFormEntity({
    entity: account,
    reset,
    defaultValues: DEFAULTS,
    mapToForm: (a) => ({
      name: a.name,
      holder: a.holder,
      number: a.number,
      cci: a.cci,
      active: a.active,
    }),
  })

  const onSubmit = (data: FormValues) => {
    run(() => savePaymentAccount(account?.id ?? null, data), {
      successMsg: isNew ? 'Método de pago creado' : 'Método de pago actualizado',
      onSuccess: () => onClose(),
      refresh: true,
    })
  }

  return (
    <AdminDrawer
      title={isNew ? 'Nuevo método de pago' : (account?.name ?? 'Método de pago')}
      sub={isNew ? 'Crear método' : 'Editar método'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4.5">
        <FormField label="Nombre" error={errors.name?.message}>
          <input {...register('name')} className={cls.input} placeholder="Yape / BCP Soles / BBVA" />
        </FormField>

        <FormField label="Titular (opcional)" error={errors.holder?.message}>
          <input {...register('holder')} className={cls.input} placeholder="Nombre del titular" />
        </FormField>

        <FormField label="Número (cuenta o celular)" error={errors.number?.message}>
          <input
            {...register('number')}
            className={cls.input}
            placeholder="987654321 o 191-1234567-0-00"
          />
        </FormField>

        <FormField label="CCI — solo cuentas bancarias (opcional)" error={errors.cci?.message}>
          <input
            {...register('cci')}
            className={cls.input}
            placeholder="002-191-001234567000-00"
          />
        </FormField>
        <p className="text-[12px] text-muted -mt-2.5">
          Para billeteras como Yape o Plin deja el CCI vacío.
        </p>

        <label className="flex items-center gap-2.5 cursor-pointer text-[13px] select-none">
          <input type="checkbox" {...register('active')} className="accent-(--gold)" />
          Visible en el checkout
        </label>

        <div className="flex gap-2.5 pt-1">
          <Button type="submit" variant="accent" size="md" full disabled={isPending}>
            {isPending ? 'Guardando...' : isNew ? 'Crear método' : 'Guardar cambios'}
          </Button>
          <Button type="button" variant="outline" size="md" full onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </AdminDrawer>
  )
}
