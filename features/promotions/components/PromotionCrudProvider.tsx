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
import { useEntityCrud } from '@/shared/hooks/admin/useEntityCrud'
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
  const crud = useEntityCrud<PromotionRow, PromotionFormValues>(
    deletePromotion,
    (p) => `"${p.name}" eliminada`,
    {
      save: {
        action: savePromotion,
        createdMsg: 'Promoción creada',
        updatedMsg: 'Promoción actualizada',
      },
      toggle: {
        action: (p) => togglePromotion(p.id, p.active),
        message: (p) => (p.active ? `"${p.name}" pausada` : `"${p.name}" activada`),
      },
    },
  )

  return (
    <PromotionCrudContext.Provider
      value={{
        openNew: crud.openNew,
        openEdit: crud.openEdit,
        openDelete: crud.openDelete,
        toggle: crud.handleToggle,
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
          onSubmit={crud.handleSave}
          isPending={crud.isPending}
        />
      )}
    </PromotionCrudContext.Provider>
  )
}
