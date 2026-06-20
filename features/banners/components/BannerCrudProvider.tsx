'use client'

import {
  deleteBanner,
  saveBanner,
  toggleBanner,
} from '@/features/banners/actions/banner.actions'
import { BannerFormDrawer } from '@/features/banners/components/BannerFormDrawer'
import { bannerDbSchema } from '@/features/banners/schemas/banner.schema'
import type { BannerRow } from '@/features/banners/types'
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal'
import { useEntityCrud } from '@/shared/hooks/admin'
import { createContext, useContext, type ReactNode } from 'react'
import type { z } from 'zod'

type BannerFormValues = z.input<typeof bannerDbSchema>

interface BannerCrudContextValue {
  openNew: () => void
  openEdit: (banner: BannerRow) => void
  openDelete: (banner: BannerRow) => void
  toggle: (banner: BannerRow) => void
  isPending: boolean
}

const BannerCrudContext = createContext<BannerCrudContextValue | null>(null)

export function useBannerCrud() {
  const ctx = useContext(BannerCrudContext)
  if (!ctx) throw new Error('useBannerCrud debe usarse dentro de BannerCrudProvider')
  return ctx
}

export function BannerCrudProvider({ children }: { children: ReactNode }) {
  const crud = useEntityCrud<BannerRow>(deleteBanner, (b) => `"${b.title}" eliminado`)

  const onSubmit = (data: BannerFormValues) => {
    crud.run(() => saveBanner(crud.editing?.id ?? null, data), {
      successMsg: crud.isNew ? 'Banner creado' : 'Banner actualizado',
      onSuccess: () => crud.closeDrawer(),
      refresh: true,
    })
  }

  const toggle = (b: BannerRow) => {
    crud.run(() => toggleBanner(b.id, b.active), {
      successMsg: b.active ? `"${b.title}" pausado` : `"${b.title}" activado`,
      refresh: true,
    })
  }

  return (
    <BannerCrudContext.Provider
      value={{
        openNew: crud.openNew,
        openEdit: crud.openEdit,
        openDelete: crud.openDelete,
        toggle,
        isPending: crud.isPending,
      }}
    >
      {children}

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
          banner={crud.editing}
          isNew={crud.isNew}
          onClose={crud.closeDrawer}
          onSubmit={onSubmit}
          isPending={crud.isPending}
        />
      )}
    </BannerCrudContext.Provider>
  )
}
