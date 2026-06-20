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
      const result = await action()
      if (result.success) {
        if (options?.successMsg) toast.success(options.successMsg)
        await options?.onSuccess?.(result.data)
        if (options?.refresh) router.refresh()
        return
      }

      toast.error(result.error)
    })
  }

  return { isPending, run }
}
