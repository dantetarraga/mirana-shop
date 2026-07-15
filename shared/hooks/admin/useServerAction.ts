'use client'

import type { ActionResult } from '@/shared/types/action-result.types'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'

export function useServerAction() {
  const [isPending, startTransition] = useTransition()
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
        const message = err instanceof Error ? err.message : 'Ocurrió un error inesperado'
        toast.error(message)
      }
    })
  }

  return { isPending, run }
}
