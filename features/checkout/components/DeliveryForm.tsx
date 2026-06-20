'use client'

import type { CheckoutInput } from '@/features/checkout/schemas/checkout.schema'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { Field, input } from './ui'

type Props = {
  register: UseFormRegister<CheckoutInput>
  errors: FieldErrors<CheckoutInput>
}

export function DeliveryForm({ register, errors }: Props) {
  return (
    <section className="bg-card border border-(--bd) p-6">
      <h2 className="font-display font-black uppercase text-[14px] tracking-[2px] text-(--gold) mb-5">
        Datos de entrega
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nombre y apellido" error={errors.fullName?.message} span={2}>
          <input {...register('fullName')} className={input} placeholder="Juan García" />
        </Field>

        <Field label="Correo electrónico" error={errors.email?.message}>
          <input
            {...register('email')}
            type="email"
            className={input}
            placeholder="tu@correo.com"
          />
        </Field>

        <Field label="Teléfono / Celular" error={errors.phone?.message}>
          <input
            {...register('phone')}
            type="tel"
            className={input}
            placeholder="+51 999 999 999"
          />
        </Field>

        <Field label="Dirección" error={errors.address?.message} span={2}>
          <input
            {...register('address')}
            className={input}
            placeholder="Av. Principal 123, Dpto. 4B"
          />
        </Field>

        <Field label="Distrito" error={errors.district?.message}>
          <input {...register('district')} className={input} placeholder="Miraflores" />
        </Field>

        <Field label="Ciudad" error={errors.city?.message}>
          <input {...register('city')} className={input} placeholder="Lima" />
        </Field>

        <Field label="Referencia (opcional)" error={errors.reference?.message} span={2}>
          <input
            {...register('reference')}
            className={input}
            placeholder="Frente al parque, puerta roja..."
          />
        </Field>
      </div>
    </section>
  )
}
