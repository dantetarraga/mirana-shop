'use client'

import { purgeTrashItem, restoreTrashItem } from '@/features/trash/actions/trash.actions'
import type { TrashRow, TrashType } from '@/features/trash/types'
import { AdminTable, type Column } from '@/shared/components/admin/AdminTable'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal'
import { useServerAction } from '@/shared/hooks/admin/useServerAction'
import { cls } from '@/shared/lib/admin/admin-classes'
import { formatDate } from '@/shared/lib/utils'
import { RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '@/shared/components/ui/EmptyState'

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
  // Fila + acción en curso: solo ese botón muestra el spinner
  const [acting, setActing] = useState<{ id: string; kind: 'restore' | 'purge' } | null>(null)
  const isActing = (id: string, kind: 'restore' | 'purge') =>
    isPending && acting?.id === id && acting.kind === kind

  const handleRestore = (row: TrashRow) => {
    setActing({ id: row.id, kind: 'restore' })
    run(() => restoreTrashItem(type, row.id), {
      successMsg: `"${row.name}" restaurado`,
      refresh: true,
    })
  }

  const handlePurge = () => {
    if (!pendingPurge) return
    const row = pendingPurge
    setPendingPurge(null)
    setActing({ id: row.id, kind: 'purge' })
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
            loading={isActing(r.id, 'restore')}
            loadingText={`Restaurando ${r.name}…`}
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
            loading={isActing(r.id, 'purge')}
            loadingText={`Eliminando ${r.name}…`}
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
      <EmptyState
        icon={Trash2}
        title="La papelera está vacía"
        description="No hay nada eliminado en esta sección."
      />
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
