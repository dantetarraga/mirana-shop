'use client'

import type { ActionResult } from '@/shared/types/action-result.types'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

/**
 * Resultado mínimo que entiende `runAsync`: el `ActionResult` estándar y las
 * actions de cuenta que todavía devuelven `{ success, error? }` sin `code`.
 */
type AnyActionResult = { success: boolean; error?: string }

/** `data` del caso de éxito (`undefined` si la action no devuelve datos). */
type SuccessData<R> = R extends { success: false }
  ? never
  : R extends { data: infer D }
    ? D
    : undefined

interface RunAsyncOptions<R> {
  /** Toast de éxito. */
  successMessage?: string
  /** Toast de error cuando la action no trae mensaje propio o lanza. */
  errorMessage?: string
  onSuccess?: (data: SuccessData<R>) => void | Promise<void>
  /** `router.refresh()` tras el éxito, para releer los Server Components. */
  refresh?: boolean
}

const UNEXPECTED_ERROR = 'Ocurrió un error inesperado'

export function useServerAction() {
  const [isTransitionPending, startTransition] = useTransition()
  // Contador y no booleano: dos `runAsync` solapados no se apagan entre sí.
  const [asyncCount, setAsyncCount] = useState(0)
  const router = useRouter()

  function run<T>(
    action: () => Promise<ActionResult<T>>,
    options?: {
      successMsg?: string
      onSuccess?: (data: T) => void | Promise<void>
      refresh?: boolean
    },
  ) {
    startTransition(async () => {
      try {
        const result = await action()
        if (result.success) {
          if (options?.successMsg) toast.success(options.successMsg)
          await options?.onSuccess?.(result.data)
          if (options?.refresh) router.refresh()
          return
        }

        toast.error(result.error)
      } catch (err) {
        // Red de seguridad: si la action lanza en vez de devolver un ActionResult
        // (error de red, excepción no controlada en el servidor, etc.), evita que
        // la excepción sin capturar tumbe la página con la pantalla de error de Next.
        const message = err instanceof Error ? err.message : UNEXPECTED_ERROR
        toast.error(message)
      }
    })
  }

  /**
   * Variante awaitable de `run`: devuelve `true` si la action salió bien, para
   * encadenar lógica local (cerrar un formulario, quitar una fila). `isPending`
   * se mantiene activo hasta el `finally`, también si la action lanza.
   */
  async function runAsync<R extends AnyActionResult>(
    action: () => Promise<R>,
    options?: RunAsyncOptions<R>,
  ): Promise<boolean> {
    setAsyncCount((n) => n + 1)
    try {
      const result = await action()
      if (!result.success) {
        toast.error(result.error || options?.errorMessage || UNEXPECTED_ERROR)
        return false
      }
      if (options?.successMessage) toast.success(options.successMessage)
      await options?.onSuccess?.((result as { data?: unknown }).data as SuccessData<R>)
      if (options?.refresh) router.refresh()
      return true
    } catch {
      toast.error(options?.errorMessage ?? UNEXPECTED_ERROR)
      return false
    } finally {
      setAsyncCount((n) => n - 1)
    }
  }

  return { isPending: isTransitionPending || asyncCount > 0, run, runAsync }
}
