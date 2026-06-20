'use client'

import {
  deletePromotion,
  savePromotion,
  togglePromotion,
} from '@/features/promotions/actions/promotion.actions'
import { PromotionFormDrawer } from '@/features/promotions/components/PromotionFormDrawer'
import { promotionDbSchema } from '@/features/promotions/schemas/promotion.schema'
import type { PromotionRow } from '@/features/promotions/types'
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal'
import { useEntityCrud } from '@/shared/hooks/admin'
import { createContext, useContext, type ReactNode } from 'react'
import type { z } from 'zod'

type PromotionFormValues = z.input<typeof promotionDbSchema>

interface PromotionCrudContextValue {
  openNew: () => void
  openEdit: (promotion: PromotionRow) => void
  openDelete: (promotion: PromotionRow) => void
  toggle: (promotion: PromotionRow) => void
  isPending: boolean
}

const PromotionCrudContext = createContext<PromotionCrudContextValue | null>(null)

export function usePromotionCrud() {
  const ctx = useContext(PromotionCrudContext)
  if (!ctx) throw new Error('usePromotionCrud debe usarse dentro de PromotionCrudProvider')
  return ctx
}

export function PromotionCrudProvider({ children }: { children: ReactNode }) {
  const crud = useEntityCrud<PromotionRow>(deletePromotion, (p) => `"${p.name}" eliminada`)

  const onSubmit = (data: PromotionFormValues) => {
    crud.run(() => savePromotion(crud.editing?.id ?? null, data), {
      successMsg: crud.isNew ? 'Promoción creada' : 'Promoción actualizada',
      onSuccess: () => crud.closeDrawer(),
      refresh: true,
    })
  }

  const toggle = (p: PromotionRow) => {
    crud.run(() => togglePromotion(p.id, p.active), {
      successMsg: p.active ? `"${p.name}" pausada` : `"${p.name}" activada`,
      refresh: true,
    })
  }

  return (
    <PromotionCrudContext.Provider
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
        title="¿Eliminar promoción?"
        description={`Esta acción eliminará "${crud.pendingDelete?.name ?? ''}" permanentemente.`}
        isPending={crud.isPending}
      />

      {crud.drawerOpen && (
        <PromotionFormDrawer
          promotion={crud.editing ?? null}
          isNew={crud.isNew}
          onClose={crud.closeDrawer}
          onSubmit={onSubmit}
          isPending={crud.isPending}
        />
      )}
    </PromotionCrudContext.Provider>
  )
}
