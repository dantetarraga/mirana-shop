'use client'

import { useEffect } from 'react'

/**
 * Sincroniza el formulario react-hook-form con la entidad seleccionada.
 * - Si `entity` tiene valor → rellena el form con `mapToForm(entity)`
 * - Si `entity` es null → resetea a `defaultValues`
 *
 * Reemplaza el `useEffect` duplicado en todos los CrudDrawers.
 *
 * @example
 * useFormEntity({
 *   entity: brand,
 *   reset,
 *   defaultValues: { name: '', slug: '', active: true },
 *   mapToForm: (b) => ({ name: b.name, slug: b.slug, active: b.active }),
 * })
 */
export function useFormEntity<TEntity>({
  entity,
  reset,
  mapToForm,
  defaultValues,
}: {
  entity: TEntity | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reset: (values?: any) => void
  mapToForm: (entity: TEntity) => Record<string, unknown>
  defaultValues: Record<string, unknown>
}) {
  useEffect(() => {
    reset(entity ? mapToForm(entity) : defaultValues)
  }, [entity]) // eslint-disable-line react-hooks/exhaustive-deps
}
