'use client'

import type { ActionResult } from '@/shared/types/action-result.types'
import { useCrudState } from './useCrudState'
import { useServerAction } from './useServerAction'

/**
 * Combina useCrudState + useServerAction con un handleDelete genérico.
 *
 * @param deleteAction  Server action que recibe el id y retorna ActionResult
 * @param deleteMsg     Función que devuelve el mensaje de éxito a partir del ítem
 *
 * @example
 * const crud = useEntityCrud<BrandRow>(deleteBrand, (b) => `"${b.name}" eliminada`)
 * // crud.handleDelete, crud.isPending, crud.run, + toda la API de useCrudState
 */
export function useEntityCrud<T extends { id: string }>(
  deleteAction: (id: string) => Promise<ActionResult>,
  deleteMsg: (item: T) => string,
) {
  const crud = useCrudState<T>()
  const { isPending, run } = useServerAction()

  const handleDelete = () => {
    if (!crud.pendingDelete) return
    const item = crud.pendingDelete
    crud.closeDelete()
    run(() => deleteAction(item.id), { successMsg: deleteMsg(item), refresh: true })
  }

  return { ...crud, isPending, run, handleDelete }
}
