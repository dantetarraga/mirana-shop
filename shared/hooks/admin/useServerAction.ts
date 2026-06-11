'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

export function useServerAction() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function run<T>(
    action: () => Promise<ActionResult<T>>,
    options?: {
      successMsg?: string
      /** Puede ser async — se awaita antes del refresh */
      onSuccess?: (data: T) => void | Promise<void>
      refresh?: boolean
    },
  ) {
    startTransition(async () => {
      const result = await action()
      if (result.success) {
        if (options?.successMsg) toast.success(options.successMsg)
        await options?.onSuccess?.(result.data)
        if (options?.refresh) router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return { isPending, run }
}
