'use client'

import {
  deleteBanner,
  saveBanner,
  toggleBanner,
} from '@/features/banners/actions/banner.actions'
import { BannerCard } from '@/features/banners/components/BannerCard'
import { BannerFormDrawer } from '@/features/banners/components/BannerFormDrawer'
import type { BannerRow } from '@/features/banners/services/banner.service'
import { PanelHeader } from '@/shared/components/admin/PanelHeader'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal'
import { useEntityCrud } from '@/shared/hooks/admin'
import { bannerDbSchema } from '@/features/banners/schemas/banner.schema'
import { Plus } from 'lucide-react'
import { z } from 'zod'

type BannerFormValues = z.input<typeof bannerDbSchema>

function getBannerStatus(banner: BannerRow): 'activo' | 'programado' | 'inactivo' {
  const now = new Date()
  if (!banner.active) return 'inactivo'
  if (banner.startsAt && banner.startsAt > now) return 'programado'
  return 'activo'
}

interface BannersClientProps {
  banners: BannerRow[]
}

export function BannersClient({ banners }: BannersClientProps) {
  const crud = useEntityCrud<BannerRow>(deleteBanner, (b) => `"${b.title}" eliminado`)

  const editingBanner = crud.editing

  const onSubmit = (data: BannerFormValues) => {
    crud.run(() => saveBanner(editingBanner?.id ?? null, data), {
      successMsg: crud.isNew ? 'Banner creado' : 'Banner actualizado',
      onSuccess: () => crud.closeDrawer(),
      refresh: true,
    })
  }

  const handleToggle = (b: BannerRow) => {
    crud.run(() => toggleBanner(b.id, b.active), {
      successMsg: b.active ? `"${b.title}" pausado` : `"${b.title}" activado`,
      refresh: true,
    })
  }

  const activeCount = banners.filter((b) => getBannerStatus(b) === 'activo').length

  return (
    <div className="px-8 pt-7 pb-12">
      <PanelHeader
        label="Marketing"
        title={`${activeCount} banner${activeCount !== 1 ? 's' : ''} activo${activeCount !== 1 ? 's' : ''}`}
        align="center"
        side={
          <Button variant="accent" size="md" onClick={crud.openNew}>
            <Plus className="mr-2" /> Nuevo banner
          </Button>
        }
      />

      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
        {banners.map((banner) => (
          <BannerCard
            key={banner.id}
            banner={banner}
            onEdit={() => crud.openEdit(banner)}
            onToggle={() => handleToggle(banner)}
            onDelete={() => crud.openDelete(banner)}
            isPending={crud.isPending}
          />
        ))}
      </div>

      <ConfirmModal
        open={!!crud.pendingDelete}
        onClose={crud.closeDelete}
        onConfirm={crud.handleDelete}
        title="¿Eliminar banner?"
        description={`"${crud.pendingDelete?.title}" se eliminará permanentemente.`}
        isPending={crud.isPending}
      />

      {crud.drawerOpen && (
        <BannerFormDrawer
          banner={editingBanner}
          isNew={crud.isNew}
          onClose={crud.closeDrawer}
          onSubmit={onSubmit}
          isPending={crud.isPending}
        />
      )}
    </div>
  )
}
