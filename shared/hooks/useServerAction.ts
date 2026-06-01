'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

/**
 * Encapsula el patrón `useTransition + toast` para Server Actions.
 *
 * @example
 * const { isPending, run } = useServerAction()
 *
 * // Con refresh automático (soft refresh — el toast sobrevive)
 * run(() => deleteItem(id), {
 *   successMsg: 'Elemento eliminado',
 *   refresh: true,
 * })
 *
 * // Con actualización optimista local (sin reload)
 * run(() => updateItem(id, data), {
 *   successMsg: 'Actualizado',
 *   onSuccess: (data) => setItems(prev => prev.map(...)),
 * })
 */
export function useServerAction() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function run<T>(
    action: () => Promise<ActionResult<T>>,
    options?: {
      successMsg?: string
      onSuccess?: (data: T) => void
      /** Llama router.refresh() tras el éxito — re-ejecuta el Server Component
       *  sin destruir el estado de React. El toast sobrevive. */
      refresh?: boolean
    },
  ) {
    startTransition(async () => {
      const result = await action()
      if (result.success) {
        if (options?.successMsg) toast.success(options.successMsg)
        options?.onSuccess?.(result.data)
        if (options?.refresh) router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return { isPending, run }
}
