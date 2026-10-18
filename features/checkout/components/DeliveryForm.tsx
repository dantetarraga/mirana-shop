'use client'

import type { CheckoutInput } from '@/features/checkout/schemas/checkout.schema'
import type { ReactNode } from 'react'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { DELIVERY_FIELD_HINTS } from './checkout-layout'
import { Field, fieldGrid, input, sectionCard, sectionLead, sectionTitle } from './ui'

type Props = {
  register: UseFormRegister<CheckoutInput>
  errors: FieldErrors<CheckoutInput>
  /**
   * La forma de entrega elegida pide dirección. En retiro en tienda y preventa
   * solo se piden los datos de contacto.
   */
  requiresAddress: boolean
  /**
   * Bajada bajo el título. CheckoutView manda el aviso de "inicia sesión" a los
   * invitados; ocupa el mismo alto que el texto de quien ya tiene sesión, así
   * el formulario no salta.
   */
  lead?: ReactNode
}

// Sin placeholders con datos de ejemplo ("Juan García", "12345678"): con un
// valor real al lado (Ciudad = "Lima") no se distinguía qué estaba lleno. La
// ayuda de formato va en el hint, debajo del campo.
//
// `autoComplete` con los tokens estándar: el navegador y los gestores de
// contraseñas rellenan nombre, correo, teléfono y dirección de un toque — en
// móvil es la diferencia entre escribir 7 campos o ninguno. En Perú:
// address-level1 = departamento/ciudad, address-level2 = provincia/ciudad,
// address-level3 = distrito.
export function DeliveryForm({ register, errors, requiresAddress, lead }: Props) {
  return (
    <section className={sectionCard} aria-labelledby="delivery-form-title">
      <h2 id="delivery-form-title" className={sectionTitle}>
        Tus datos
      </h2>
      <p className={`${sectionLead} min-h-10 sm:min-h-5`}>
        {lead ?? 'Los usamos para confirmar tu pedido y coordinar la entrega.'}
      </p>

      <div className={fieldGrid}>
        <Field label="Nombre y apellido" error={errors.fullName?.message} span={2} required>
          {(a11y) => (
            <input
              {...a11y}
              {...register('fullName')}
              className={input}
              autoComplete="name"
              autoCapitalize="words"
            />
          )}
        </Field>

        <Field label="DNI" hint={DELIVERY_FIELD_HINTS.dni} error={errors.dni?.message} required>
          {(a11y) => (
            <input
              {...a11y}
              {...register('dni')}
              className={input}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              autoComplete="off"
            />
          )}
        </Field>

        <Field
          label="Celular"
          hint={DELIVERY_FIELD_HINTS.phone}
          error={errors.phone?.message}
          required
        >
          {(a11y) => (
            <input
              {...a11y}
              {...register('phone')}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className={input}
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
                />
              )}
            </Field>

            <Field
              label="Referencia"
              hint={DELIVERY_FIELD_HINTS.reference}
              error={errors.reference?.message}
              span={2}
            >
              {(a11y) => (
                <input {...a11y} {...register('reference')} autoComplete="off" className={input} />
              )}
            </Field>
          </>
        )}
      </div>

      {!requiresAddress && (
        <p className="text-[13px] text-muted mt-5 leading-snug">
          Con esta forma de entrega no necesitamos tu dirección. Te contactaremos al celular y
          correo que dejaste para coordinar.
        </p>
      )}
    </section>
  )
}
