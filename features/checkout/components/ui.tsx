'use client'

import { Field as BaseField, type FieldControlProps } from '@/shared/components/ui/Field'
import type { ReactNode } from 'react'

/**
 * Estilo de campo de la tienda. `text-base` (16px) en móvil: con menos, Safari
 * iOS hace zoom al enfocar el input y descoloca todo el formulario.
 */
export const input =
  'w-full bg-surf border border-field text-text font-sans text-base sm:text-[14px] px-[13px] py-[11px] outline-none placeholder:text-muted/75 focus:border-accent-ink aria-[invalid=true]:border-danger transition-colors duration-150'

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
      labelClassName="block text-[11px] tracking-[2px] uppercase text-accent-ink mb-1.5"
      hintClassName="text-muted text-[12px] mt-1"
    >
      {children}
    </BaseField>
  )
}

export function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="w-5 h-5 shrink-0 bg-(--gold) text-on-accent font-display font-black text-[11px] flex items-center justify-center">
        {n}
      </span>
      <p className="text-muted">{children}</p>
    </div>
  )
}
