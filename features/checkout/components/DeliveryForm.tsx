'use client'

import type { CheckoutInput } from '@/features/checkout/schemas/checkout.schema'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { Field, input } from './ui'

type Props = {
  register: UseFormRegister<CheckoutInput>
  errors: FieldErrors<CheckoutInput>
  /**
   * La forma de entrega elegida pide dirección. En retiro en tienda y preventa
   * solo se piden los datos de contacto.
   */
  requiresAddress: boolean
}

// `autoComplete` con los tokens estándar: el navegador y los gestores de
// contraseñas rellenan nombre, correo, teléfono y dirección de un toque — en
// móvil es la diferencia entre escribir 7 campos o ninguno. En Perú:
// address-level1 = departamento/ciudad, address-level2 = provincia/ciudad,
// address-level3 = distrito.
export function DeliveryForm({ register, errors, requiresAddress }: Props) {
  return (
    <section className="bg-card border border-(--bd) p-6" aria-labelledby="delivery-form-title">
      <h2
        id="delivery-form-title"
        className="font-display font-black uppercase text-[14px] tracking-[2px] text-accent-ink mb-2"
      >
        Datos de entrega
      </h2>
      <p className="text-[12px] text-muted mb-5">
        Los campos marcados con <span className="text-danger">*</span> son obligatorios.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nombre y apellido" error={errors.fullName?.message} span={2} required>
          {(a11y) => (
            <input
              {...a11y}
              {...register('fullName')}
              className={input}
              placeholder="Juan García"
              autoComplete="name"
              autoCapitalize="words"
            />
          )}
        </Field>

        <Field label="DNI" error={errors.dni?.message} required>
          {(a11y) => (
            <input
              {...a11y}
              {...register('dni')}
              className={input}
              placeholder="12345678"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              autoComplete="off"
            />
          )}
        </Field>

        <Field label="Teléfono / Celular" error={errors.phone?.message} required>
          {(a11y) => (
            <input
              {...a11y}
              {...register('phone')}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className={input}
              placeholder="+51 999 999 999"
            />
          )}
        </Field>

        <Field label="Correo electrónico" error={errors.email?.message} span={2} required>
          {(a11y) => (
            <input
              {...a11y}
              {...register('email')}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              className={input}
              placeholder="tu@correo.com"
            />
          )}
        </Field>

        {requiresAddress && (
          <>
            <Field label="Dirección" error={errors.address?.message} span={2} required>
              {(a11y) => (
                <input
                  {...a11y}
                  {...register('address')}
                  autoComplete="street-address"
                  className={input}
                  placeholder="Av. Principal 123, Dpto. 4B"
                />
              )}
            </Field>

            <Field label="Distrito" error={errors.district?.message} required>
              {(a11y) => (
                <input
                  {...a11y}
                  {...register('district')}
                  autoComplete="address-level3"
                  className={input}
                  placeholder="Miraflores"
                />
              )}
            </Field>

            <Field label="Ciudad" error={errors.city?.message} required>
              {(a11y) => (
                <input
                  {...a11y}
                  {...register('city')}
                  autoComplete="address-level2"
                  className={input}
                  placeholder="Lima"
                />
              )}
            </Field>

            <Field label="Referencia (opcional)" error={errors.reference?.message} span={2}>
              {(a11y) => (
                <input
                  {...a11y}
                  {...register('reference')}
                  autoComplete="off"
                  className={input}
                  placeholder="Frente al parque, puerta roja..."
                />
              )}
            </Field>
          </>
        )}
      </div>

      {!requiresAddress && (
        <p className="text-[12px] text-muted mt-4 leading-snug">
          Con esta forma de entrega no necesitamos tu dirección. Te contactaremos al teléfono y
          correo que dejaste para coordinar.
        </p>
      )}
    </section>
  )
}
