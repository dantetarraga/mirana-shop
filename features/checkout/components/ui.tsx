'use client'

import { Field as BaseField, type FieldControlProps } from '@/shared/components/ui/Field'
import type { ReactNode } from 'react'
import { fieldHint, fieldLabel } from './checkout-layout'

export {
  fieldGrid,
  fieldHint,
  fieldLabel,
  input,
  sectionCard,
  sectionLead,
  sectionTitle,
} from './checkout-layout'

export type { FieldControlProps }

/**
 * Campo de formulario de la tienda sobre el primitivo `Field`: label asociado
 * (htmlFor/id vía useId), error anunciado (role="alert") y ligado al input por
 * aria-describedby. El control se recibe como render-prop para que el id y los
 * aria-* lleguen al <input> real:
 *
 *   <Field label="DNI" error={errors.dni?.message} required>
 *     {(a11y) => <input {...a11y} {...register('dni')} className={input} />}
 *   </Field>
 */
export function Field({
  label,
  error,
  hint,
  required,
  children,
  span,
}: {
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: (props: FieldControlProps) => ReactNode
  span?: number
}) {
  return (
    <BaseField
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={span === 2 ? 'sm:col-span-2' : undefined}
      labelClassName={fieldLabel}
      hintClassName={fieldHint}
    >
      {children}
    </BaseField>
  )
}

/** Paso numerado de una secuencia real (próximos pasos tras confirmar). */
export function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3 items-start">
      <span
        aria-hidden
        className="size-6 shrink-0 bg-(--gold) text-on-accent font-display font-black text-[13px] flex items-center justify-center"
      >
        {n}
      </span>
      <p className="text-text/90 pt-0.5">{children}</p>
    </li>
  )
}
