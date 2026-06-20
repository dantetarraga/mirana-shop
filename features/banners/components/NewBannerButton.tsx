'use client'

import { useBannerCrud } from '@/features/banners/components/BannerCrudProvider'
import { Button } from '@/shared/components/ui/Button'
import { Plus } from 'lucide-react'
import type { ReactNode } from 'react'

interface NewBannerButtonProps {
  children?: ReactNode
}

export function NewBannerButton({ children }: NewBannerButtonProps) {
  const { openNew } = useBannerCrud()

  return (
    <Button variant="accent" size="md" onClick={openNew}>
      <Plus className="mr-2" /> {children ?? 'Nuevo banner'}
    </Button>
  )
}
