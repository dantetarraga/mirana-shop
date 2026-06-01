'use client'

import { deleteBanner, saveBanner, toggleBanner } from '@/features/banners/actions/banner.actions'
import { BannerCard } from '@/features/banners/components/BannerCard'
import { BannerFormDrawer } from '@/features/banners/components/BannerFormDrawer'
import type { BannerRow } from '@/modules/catalog/repositories/banner.repo'
import { PanelHeader } from '@/shared/components/PanelHeader'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal'
import { useServerAction } from '@/shared/hooks'
import { bannerDbSchema } from '@/shared/lib/schemas'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { z } from 'zod'

type BannerFormValues = z.input<typeof bannerDbSchema>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getBannerStatus(banner: BannerRow): 'activo' | 'programado' | 'inactivo' {
  const now = new Date()
  if (!banner.active) return 'inactivo'
  if (banner.startsAt && banner.startsAt > now) return 'programado'
  return 'activo'
}

// ---------------------------------------------------------------------------
// Props — "banners" viene siempre del servidor, nunca de estado cliente
// ---------------------------------------------------------------------------

interface BannersClientProps {
  banners: BannerRow[]
}

/**
 * Coordinador principal del panel de banners.
 * Maneja el estado de UI (drawers, modales) y delega renderizado a componentes granulares.
 */
export function BannersClient({ banners }: BannersClientProps) {
  // Solo estado de UI: qué drawer está abierto
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<BannerRow | null>(null)
  const { isPending, run } = useServerAction()
  const router = useRouter()

  // editingBanner se deriva de la prop (no de estado local)
  const editingBanner = banners.find((b) => b.id === editingId) ?? null

  const closeDrawer = () => {
    setEditingId(null)
    setIsNew(false)
  }

  // ---------------------------------------------------------------------------
  // Handlers — router.refresh() re-ejecuta el Server Component con datos frescos
  // ---------------------------------------------------------------------------

  const onSubmit = (data: BannerFormValues) => {
    run(() => saveBanner(editingId, data), {
      successMsg: isNew ? 'Banner creado' : 'Banner actualizado',
      onSuccess: () => {
        closeDrawer()
        router.refresh()
      },
    })
  }

  const handleToggle = (b: BannerRow) => {
    run(() => toggleBanner(b.id, b.active), {
      successMsg: b.active ? `"${b.title}" pausado` : `"${b.title}" activado`,
      onSuccess: () => router.refresh(),
    })
  }

  const handleDelete = () => {
    if (!pendingDelete) return
    const b = pendingDelete
    setPendingDelete(null)
    run(() => deleteBanner(b.id), {
      successMsg: `"${b.title}" eliminado`,
      onSuccess: () => router.refresh(),
    })
  }

  // ---------------------------------------------------------------------------
  // Render — composición de componentes granulares
  // ---------------------------------------------------------------------------

  const activeCount = banners.filter((b) => getBannerStatus(b) === 'activo').length
  const drawerOpen = isNew || editingId !== null

  return (
    <div className="px-8 pt-7 pb-12">
      <PanelHeader
        label="Marketing"
        title={`${activeCount} banner${activeCount !== 1 ? 's' : ''} activo${activeCount !== 1 ? 's' : ''}`}
        align="center"
        side={
          <Button
            variant="accent"
            size="md"
            onClick={() => {
              setEditingId(null)
              setIsNew(true)
            }}
          >
            <Plus className="mr-2" /> Nuevo banner
          </Button>
        }
      />

      {/* Grid de banners — renderizado delegado a BannerCard */}
      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
        {banners.map((banner) => (
          <BannerCard
            key={banner.id}
            banner={banner}
            onEdit={() => {
              setIsNew(false)
              setEditingId(banner.id)
            }}
            onToggle={() => handleToggle(banner)}
            onDelete={() => setPendingDelete(banner)}
            isPending={isPending}
          />
        ))}
      </div>

      {/* Modal de confirmación de eliminación */}
      <ConfirmModal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="¿Eliminar banner?"
        description={`"${pendingDelete?.title}" se eliminará permanentemente.`}
        isPending={isPending}
      />

      {/* Drawer de formulario — delegado a BannerFormDrawer */}
      {drawerOpen && (
        <BannerFormDrawer
          banner={editingBanner}
          isNew={isNew}
          onClose={closeDrawer}
          onSubmit={onSubmit}
          isPending={isPending}
        />
      )}
    </div>
  )
}
