'use client'

import { useEffect } from 'react'

/**
 * Convierte un string a slug URL-friendly.
 * Centraliza la lógica antes duplicada en cada CrudDrawer.
 */
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Auto-genera el campo `slug` a partir del `name` cuando se crea un nuevo ítem.
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
      setValue(field, toSlug(name), { shouldValidate: false })
    }
  }, [isNew, name, setValue, field])
}
