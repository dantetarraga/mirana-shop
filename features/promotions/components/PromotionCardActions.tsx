'use client'

import { usePromotionCrud } from '@/features/promotions/components/PromotionCrudProvider'
import type { PromotionRow } from '@/features/promotions/types'
import { Button } from '@/shared/components/ui/Button'

interface PromotionCardActionsProps {
  promotion: PromotionRow
}

export function PromotionCardActions({ promotion }: PromotionCardActionsProps) {
  const { openEdit, openDelete, toggle, isPending } = usePromotionCrud()

  return (
    <div className="flex gap-2 px-5 pb-5">
      <Button variant="outline" size="sm" full onClick={() => openEdit(promotion)}>
        Editar
      </Button>
      <Button
        variant="outline"
        size="sm"
        full
        onClick={() => toggle(promotion)}
        disabled={isPending}
      >
        {promotion.active ? 'Pausar' : 'Activar'}
      </Button>
      <Button
        variant="icon"
        size="sm"
        destructive
        onClick={() => openDelete(promotion)}
        disabled={isPending}
      >
        ×
      </Button>
    </div>
  )
}
