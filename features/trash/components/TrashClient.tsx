'use client'

import { purgeTrashItem, restoreTrashItem } from '@/features/trash/actions/trash.actions'
import type { TrashRow, TrashType } from '@/features/trash/types'
import { AdminTable, type Column } from '@/shared/components/admin/AdminTable'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal'
import { useServerAction } from '@/shared/hooks/admin'
import { cls } from '@/shared/lib/admin/admin-classes'
import { formatDate } from '@/shared/lib/utils'
import { RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'

const SUB_LABEL: Record<TrashType, string> = {
  product: 'SKU',
  collection: 'Slug',
  category: 'Slug',
  brand: 'Slug',
  user: 'Email',
}

const SINGULAR: Record<TrashType, string> = {
  product: 'el producto',
  collection: 'la colección',
  category: 'la categoría',
  brand: 'la marca',
  user: 'el usuario',
}

interface TrashClientProps {
  type: TrashType
  items: TrashRow[]
}

export function TrashClient({ type, items }: TrashClientProps) {
  const { isPending, run } = useServerAction()
  const [pendingPurge, setPendingPurge] = useState<TrashRow | null>(null)

  const handleRestore = (row: TrashRow) => {
    run(() => restoreTrashItem(type, row.id), {
      successMsg: `"${row.name}" restaurado`,
      refresh: true,
    })
  }

  const handlePurge = () => {
    if (!pendingPurge) return
    const row = pendingPurge
    setPendingPurge(null)
    run(() => purgeTrashItem(type, row.id), {
      successMsg: `"${row.name}" eliminado definitivamente`,
      refresh: true,
    })
  }

  const columns: Column<TrashRow>[] = [
    {
      header: 'Nombre',
      render: (r) => (
        <div>
          <div className={cls.rowName}>{r.name}</div>
          {r.sub && (
            <div className={cls.rowSub}>
              {SUB_LABEL[type]}: {r.sub}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Eliminado',
      className: 'text-[13px] text-muted whitespace-nowrap',
      render: (r) => formatDate(new Date(r.deletedAt), "d 'de' MMMM 'de' yyyy, HH:mm"),
    },
    {
      header: 'Purga',
      render: (r) =>
        r.purgeBlockedReason ? (
          <span className="text-[12px] text-muted max-w-xs block">{r.purgeBlockedReason}</span>
        ) : (
          <span className="text-[12px] text-muted">Disponible</span>
        ),
    },
    {
      header: 'Acciones',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (r) => (
        <div className="flex gap-1.5 justify-end">
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => handleRestore(r)}
            title="Restaurar"
          >
            <RotateCcw size={14} className="mr-1.5" /> Restaurar
          </Button>
          <Button
            variant="icon"
            size="sm"
            destructive
            disabled={isPending || !!r.purgeBlockedReason}
            onClick={() => setPendingPurge(r)}
            title={r.purgeBlockedReason ?? 'Eliminar definitivamente'}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ]

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-muted text-sm">
        No hay nada eliminado en esta sección.
      </div>
    )
  }

  return (
    <>
      <AdminTable columns={columns} data={items} keyExtractor={(r) => r.id} />

      <ConfirmModal
        open={!!pendingPurge}
        onClose={() => setPendingPurge(null)}
        onConfirm={handlePurge}
        title="¿Eliminar definitivamente?"
        description={`"${pendingPurge?.name}" se borrará de la base de datos junto con sus imágenes y asociaciones. Esta acción no se puede deshacer: si crees que puedes necesitar ${SINGULAR[type]} más adelante, déjalo en la papelera.`}
        confirmLabel="Eliminar definitivamente"
        isPending={isPending}
      />
    </>
  )
}
