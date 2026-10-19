'use client'

import { SelectMenu, type SelectMenuProps } from '@/shared/components/ui/SelectMenu'
import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
  type PathValue,
} from 'react-hook-form'

type FormSelectMenuProps<T extends FieldValues, V extends string> = Omit<
  SelectMenuProps<V>,
  'value' | 'onChange' | 'onBlur' | 'name'
> & {
  control: Control<T>
  name: FieldPath<T>
  /** Valor guardado cuando se elige la opción (por defecto, el mismo string). */
  toFormValue?: (value: V) => PathValue<T, FieldPath<T>>
}

/**
 * SelectMenu conectado a react-hook-form: reemplaza a `<Select {...register(name)}>`.
 * Los props de accesibilidad que inyecta FormField (id, aria-*) pasan al botón.
 */
export function FormSelectMenu<T extends FieldValues, V extends string>({
  control,
  name,
  toFormValue,
  ...props
}: FormSelectMenuProps<T, V>) {
  const { field } = useController({ control, name })
  return (
    <SelectMenu<V>
      {...props}
      name={field.name}
      value={(field.value ?? '') as V | ''}
      onChange={(v) => field.onChange(toFormValue ? toFormValue(v) : v)}
      onBlur={field.onBlur}
    />
  )
}
