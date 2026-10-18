'use client'

import { slugify } from '@/shared/lib/slug'
import { useEffect } from 'react'

/**
 * Auto-genera el campo `slug` a partir del `name` cuando se crea un nuevo ítem,
 * con el mismo `slugify` que usan las actions en el servidor.
 * No sobrescribe el slug si el usuario lo edita manualmente.
 *
 * @example
 * useAutoSlug({ name: watch('name'), isNew, setValue })
 */
export function useAutoSlug({
  name,
  isNew,
  setValue,
  field = 'slug',
}: {
  name: string
  isNew: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: (field: any, value: any, options?: object) => void
  field?: string
}) {
  useEffect(() => {
    if (isNew && name) {
      setValue(field, slugify(name), { shouldValidate: false })
    }
  }, [isNew, name, setValue, field])
}
