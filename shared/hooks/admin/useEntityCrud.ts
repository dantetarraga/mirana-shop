'use client'

import type { ActionResult } from '@/shared/types/action-result.types'
import { useCrudState } from './useCrudState'
import { useServerAction } from './useServerAction'

interface EntityCrudOptions<T, TInput> {
  /**
   * Guardado desde el drawer: `id` null = crear. Al terminar bien cierra el
   * drawer y refresca la página.
   */
  save?: {
    action: (id: string | null, data: TInput) => Promise<ActionResult<unknown>>
    createdMsg: string
    updatedMsg: string
  }
  /** Activar/pausar desde la tabla o la tarjeta. */
  toggle?: {
    action: (item: T) => Promise<ActionResult>
    message: (item: T) => string
  }
}

/**
 * Combina useCrudState + useServerAction con los handlers genéricos de borrar,
 * guardar y activar/pausar.
 *
 * @param deleteAction  Server action que recibe el id y retorna ActionResult
 * @param deleteMsg     Función que devuelve el mensaje de éxito a partir del ítem
 * @param options       `save` / `toggle` opcionales (ver EntityCrudOptions)
 *
 * @example
 * const crud = useEntityCrud<BrandRow>(deleteBrand, (b) => `"${b.name}" eliminada`)
 * // crud.handleDelete, crud.isPending, crud.run, + toda la API de useCrudState
 *
 * const crud = useEntityCrud<BannerRow, BannerFormValues>(deleteBanner, msg, {
 *   save: { action: saveBanner, createdMsg: 'Banner creado', updatedMsg: 'Banner actualizado' },
 *   toggle: { action: (b) => toggleBanner(b.id, b.active), message: (b) => `...` },
 * })
 * // + crud.handleSave(data), crud.handleToggle(item)
 */
export function useEntityCrud<T extends { id: string }, TInput = never>(
  deleteAction: (id: string) => Promise<ActionResult>,
  deleteMsg: (item: T) => string,
  options: EntityCrudOptions<T, TInput> = {},
) {
  const crud = useCrudState<T>()
  const { isPending, run } = useServerAction()

  const handleDelete = () => {
    if (!crud.pendingDelete) return
    const item = crud.pendingDelete
    crud.closeDelete()
    run(() => deleteAction(item.id), { successMsg: deleteMsg(item), refresh: true })
  }

  const handleSave = (data: TInput) => {
    const { save } = options
    if (!save) return
    run(() => save.action(crud.editing?.id ?? null, data), {
      successMsg: crud.isNew ? save.createdMsg : save.updatedMsg,
      onSuccess: () => crud.closeDrawer(),
      refresh: true,
    })
  }

  const handleToggle = (item: T) => {
    const { toggle } = options
    if (!toggle) return
    run(() => toggle.action(item), { successMsg: toggle.message(item), refresh: true })
  }

  return { ...crud, isPending, run, handleDelete, handleSave, handleToggle }
}
