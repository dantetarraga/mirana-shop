import { Field } from '@/shared/components/ui/Field'
import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
}

/**
 * Campo del admin: label + control + error sobre el primitivo `Field`. Si
 * `children` es un único control (input, select, textarea…), recibe `id`,
 * `aria-invalid` y `aria-describedby` hacia el error; con hijos compuestos se
 * comporta como un rótulo visual.
 */
export function FormField({ label, error, hint, required, children }: FormFieldProps) {
  return (
    <Field label={label} error={error} hint={hint} required={required}>
      {children}
    </Field>
  )
}
