'use client'

import {
  deletePromotion,
  savePromotion,
  togglePromotion,
} from '@/features/promotions/actions/promotion.actions'
import { PromotionCard } from '@/features/promotions/components/PromotionCard'
import { PromotionFormDrawer } from '@/features/promotions/components/PromotionFormDrawer'
import type { PromotionRow } from '@/features/promotions/services/promotion.service'
import { PanelHeader } from '@/shared/components/admin/PanelHeader'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal'
import { useEntityCrud } from '@/shared/hooks/admin'
import { promotionDbSchema } from '@/shared/lib/schemas'
import { Plus } from 'lucide-react'
import type { z } from 'zod'

type FormValues = z.input<typeof promotionDbSchema>

interface Props {
  promotions: PromotionRow[]
}

export function PromotionsClient({ promotions }: Props) {
  const crud = useEntityCrud<PromotionRow>(deletePromotion, (p) => `"${p.name}" eliminada`)

  const editing = crud.editing

  const onSubmit = (data: FormValues) => {
    crud.run(() => savePromotion(editing?.id ?? null, data), {
      successMsg: crud.isNew ? 'Promoción creada' : 'Promoción actualizada',
      onSuccess: () => crud.closeDrawer(),
      refresh: true,
    })
  }

  const handleToggle = (p: PromotionRow) => {
    crud.run(() => togglePromotion(p.id, p.active), {
      successMsg: p.active ? `"${p.name}" pausada` : `"${p.name}" activada`,
      refresh: true,
    })
  }

  const activeCount = promotions.filter((p) => p.active).length

  return (
    <div className="px-8 pt-7 pb-12">
      <PanelHeader
        label="Marketing"
        title={`${activeCount} promoción${activeCount !== 1 ? 'es' : ''} activa${activeCount !== 1 ? 's' : ''}`}
        align="center"
        side={
          <Button variant="accent" size="md" onClick={crud.openNew}>
            <Plus className="mr-2" /> Nueva promoción
          </Button>
        }
      />

      {promotions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted gap-3">
          <span className="text-[48px]">🏷️</span>
          <p className="text-[14px]">No hay promociones creadas todavía.</p>
          <Button variant="accent" size="md" onClick={crud.openNew}>
            <Plus className="mr-2" /> Crear primera promoción
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
          {promotions.map((promo) => (
            <PromotionCard
              key={promo.id}
              promotion={promo}
              onEdit={() => crud.openEdit(promo)}
              onToggle={() => handleToggle(promo)}
              onDelete={() => crud.openDelete(promo)}
              isPending={crud.isPending}
            />
          ))}
        </div>
      )}

      {/* Form Drawer */}
      {crud.drawerOpen && (
        <PromotionFormDrawer
          promotion={editing ?? null}
          isNew={crud.isNew}
          onClose={crud.closeDrawer}
          onSubmit={onSubmit}
          isPending={crud.isPending}
        />
      )}

      {/* Confirm delete */}
      <ConfirmModal
        open={!!crud.pendingDelete}
        onClose={crud.closeDelete}
        onConfirm={crud.handleDelete}
        title="¿Eliminar promoción?"
        description={`Esta acción eliminará "${crud.pendingDelete?.name ?? ''}" permanentemente.`}
        isPending={isPending}
      />
    </div>
  )
}
