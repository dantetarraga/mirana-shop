'use client'

import { useId, type ReactNode } from 'react'

/**
 * Estilo de campo de la tienda. `text-base` (16px) en móvil: con menos, Safari
 * iOS hace zoom al enfocar el input y descoloca todo el formulario.
 */
export const input =
  'w-full bg-surf border border-(--bd) text-text font-sans text-base sm:text-[14px] px-[13px] py-[11px] outline-none focus:border-(--gold)/50 aria-[invalid=true]:border-danger transition-colors duration-150'

/** Props de accesibilidad que Field entrega al control. */
export interface FieldControlProps {
  id: string
  'aria-invalid': boolean
  'aria-describedby': string | undefined
  'aria-required': boolean | undefined
}

/**
 * Campo de formulario con label asociado (htmlFor/id vía useId), error
 * anunciado (role="alert") y ligado al input por aria-describedby.
 *
 * Antes el <label> no apuntaba a nada: el lector leía "edit text" sin nombre y
 * tocar el texto del label no enfocaba el input. El control se recibe como
 * render-prop para que el id y los aria-* lleguen al <input> real:
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
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ')

  return (
    <div className={span === 2 ? 'sm:col-span-2' : undefined}>
      <label htmlFor={id} className="block text-[11px] tracking-[2px] uppercase text-accent-ink mb-1.5">
        {label}
        {required && (
          <>
            <span aria-hidden className="text-danger ml-0.5">
              *
            </span>
            <span className="sr-only"> (obligatorio)</span>
          </>
        )}
      </label>
      {children({
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': describedBy || undefined,
        'aria-required': required || undefined,
      })}
      {hint && !error && (
        <p id={hintId} className="text-muted text-[12px] mt-1">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-danger text-[12px] mt-1">
          {error}
        </p>
      )}
    </div>
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
