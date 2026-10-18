import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react'

// ---------------------------------------------------------------------------
// Field — primitivo único de "label + control + hint + error" accesible. Lo
// usan FormField (admin), el Field del checkout y el Libro de Reclamaciones;
// cada uno solo fija su tipografía.
//
// El control recibe `id` (para el htmlFor del label), `aria-invalid`,
// `aria-required` y `aria-describedby` hacia el hint/error, de dos formas:
//
//   - render-prop:   <Field label="DNI">{(a11y) => <input {...a11y} />}</Field>
//   - hijo único:    <Field label="DNI"><input /></Field>   (vía cloneElement)
//
// Con hijos compuestos (un componente, varios nodos) no se inyecta nada y el
// label queda como rótulo visual, igual que antes.
// ---------------------------------------------------------------------------

/** Props de accesibilidad que Field entrega al control. */
export interface FieldControlProps {
  id: string
  'aria-invalid': boolean | undefined
  'aria-describedby': string | undefined
  'aria-required': boolean | undefined
}

type ClonableControlProps = Partial<FieldControlProps>

export interface FieldProps {
  label: ReactNode
  error?: string
  hint?: ReactNode
  required?: boolean
  /** Id fijo del control (y base de `-hint`/`-error`). Por defecto, useId(). */
  id?: string
  /** Clases del contenedor (p. ej. `sm:col-span-2`). */
  className?: string
  labelClassName?: string
  hintClassName?: string
  /** Mantiene el hint visible también cuando hay error (por defecto se oculta). */
  persistentHint?: boolean
  children: ReactNode | ((props: FieldControlProps) => ReactNode)
}

export const FIELD_LABEL_CLS = 'block text-[10px] tracking-[2px] uppercase text-accent-ink mb-1.5'
export const FIELD_HINT_CLS = 'mt-1 text-[11px] text-muted'
const FIELD_ERROR_CLS = 'mt-1 text-[12px] text-danger'

export function Field({
  label,
  error,
  hint,
  required,
  id,
  className,
  labelClassName = FIELD_LABEL_CLS,
  hintClassName = FIELD_HINT_CLS,
  persistentHint = false,
  children,
}: FieldProps) {
  const autoId = useId()
  const baseId = id ?? autoId
  const errorId = `${baseId}-error`
  const hintId = `${baseId}-hint`
  const showHint = Boolean(hint) && (persistentHint || !error)

  const isRenderProp = typeof children === 'function'
  const single =
    !isRenderProp &&
    isValidElement<ClonableControlProps>(children) &&
    typeof children.type === 'string'
  const childProps = single ? (children as ReactElement<ClonableControlProps>).props : null

  const controlId = isRenderProp ? baseId : (childProps?.id ?? (single ? baseId : undefined))
  const describedBy =
    [childProps?.['aria-describedby'], showHint ? hintId : null, error ? errorId : null]
      .filter(Boolean)
      .join(' ') || undefined

  const controlProps: FieldControlProps | null = controlId
    ? {
        id: controlId,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
        'aria-required': required || undefined,
      }
    : null

  const control = isRenderProp
    ? children(controlProps!)
    : single && controlProps
      ? cloneElement(children as ReactElement<ClonableControlProps>, controlProps)
      : (children as ReactNode)

  return (
    <div className={className}>
      <label htmlFor={controlId} className={labelClassName}>
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
      {showHint && (
        <p id={hintId} className={hintClassName}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className={FIELD_ERROR_CLS}>
          {error}
        </p>
      )}
    </div>
  )
}
