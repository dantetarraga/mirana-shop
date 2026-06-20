'use client'

import { usePromotionCrud } from '@/features/promotions/components/PromotionCrudProvider'
import { Button } from '@/shared/components/ui/Button'
import { Plus } from 'lucide-react'
import type { ReactNode } from 'react'

interface NewPromotionButtonProps {
  children?: ReactNode
}

export function NewPromotionButton({ children }: NewPromotionButtonProps) {
  const { openNew } = usePromotionCrud()

  return (
    <Button variant="accent" size="md" onClick={openNew}>
      <Plus className="mr-2" /> {children ?? 'Nueva promoción'}
    </Button>
  )
}
