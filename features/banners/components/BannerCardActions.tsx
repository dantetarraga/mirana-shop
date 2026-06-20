'use client'

import { useBannerCrud } from '@/features/banners/components/BannerCrudProvider'
import type { BannerRow } from '@/features/banners/types'
import { Button } from '@/shared/components/ui/Button'
import { Trash2 } from 'lucide-react'

interface BannerCardActionsProps {
  banner: BannerRow
}

export function BannerCardActions({ banner }: BannerCardActionsProps) {
  const { openEdit, openDelete, toggle, isPending } = useBannerCrud()

  return (
    <div className="flex gap-2 mt-3">
      <Button variant="outline" size="sm" full onClick={() => openEdit(banner)}>
        Editar
      </Button>
      <Button
        variant="outline"
        size="sm"
        full
        onClick={() => toggle(banner)}
        disabled={isPending}
      >
        {banner.active ? 'Pausar' : 'Activar'}
      </Button>
      <Button
        variant="icon"
        size="sm"
        destructive
        onClick={() => openDelete(banner)}
        disabled={isPending}
      >
        <Trash2 size={14} />
      </Button>
    </div>
  )
}
