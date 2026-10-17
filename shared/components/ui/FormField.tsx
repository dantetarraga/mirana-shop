import { cls } from '@/shared/lib/admin/admin-classes'
import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react'

interface FormFieldProps {
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
}

type ControlProps = {
  id?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
  'aria-required'?: boolean
}

/**
 * Label + control + error. Si `children` es un único control (input, select,
 * textarea…), se le inyectan `id` (para el htmlFor del label), `aria-invalid`
 * y `aria-describedby` hacia el error — antes el label no apuntaba a nada y el
 * error no se anunciaba. Con hijos compuestos se comporta como antes.
 */
export function FormField({ label, error, hint, required, children }: FormFieldProps) {
  const autoId = useId()
  const single = isValidElement<ControlProps>(children) && typeof children.type === 'string'
  const controlId = single ? ((children as ReactElement<ControlProps>).props.id ?? autoId) : undefined
  const errorId = `${autoId}-error`
  const hintId = `${autoId}-hint`
  const describedBy =
    [
      single ? (children as ReactElement<ControlProps>).props['aria-describedby'] : null,
      hint ? hintId : null,
      error ? errorId : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined

  const control = single
    ? cloneElement(children as ReactElement<ControlProps>, {
        id: controlId,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
        'aria-required': required || undefined,
      })
    : children

  return (
    <div>
      <label htmlFor={controlId} className={`${cls.label} block`}>
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
      {control}
      {hint && !error && (
        <p id={hintId} className="mt-1 text-[11px] text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-[12px] text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
