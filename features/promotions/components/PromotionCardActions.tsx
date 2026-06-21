'use client'

import { usePromotionCrud } from '@/features/promotions/components/PromotionCrudProvider'
import type { PromotionRow } from '@/features/promotions/types'
import { Button } from '@/shared/components/ui/Button'
import { Trash2 } from 'lucide-react'

interface PromotionCardActionsProps {
  promotion: PromotionRow
}

export function PromotionCardActions({ promotion }: PromotionCardActionsProps) {
  const { openEdit, openDelete, toggle, isPending } = usePromotionCrud()

  return (
    <div className="flex gap-2 px-5 pb-5">
      <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(promotion)}>
        Editar
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="flex-1"
        onClick={() => toggle(promotion)}
        disabled={isPending}
      >
        {promotion.active ? 'Pausar' : 'Activar'}
      </Button>
      <Button
        variant="icon"
        size="sm"
        className="h-full flex-1"
        destructive
        onClick={() => openDelete(promotion)}
        disabled={isPending}
      >
        <Trash2 size={14} />
      </Button>
    </div>
  )
}
