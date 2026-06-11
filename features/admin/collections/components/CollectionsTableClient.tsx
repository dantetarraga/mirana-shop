'use client'

import { deleteCollection } from '@/features/collections/actions/collection.actions'
import { CollectionCrudDrawer } from '@/features/collections/components/CollectionCrudDrawer'
import type { CollectionRow } from '@/modules/catalog/repositories/collection.repo'
import { AdminTable, type Column } from '@/shared/components/AdminTable'
import { EntityProductsDrawer } from '@/shared/components/EntityProductsDrawer'
import { PanelHeader } from '@/shared/components/PanelHeader'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal'
import { useCrudState, useServerAction } from '@/shared/hooks'
import { cls } from '@/shared/lib/admin-classes'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface CollectionsTableClientProps {
  collections: CollectionRow[]
  total: number
}

export function CollectionsTableClient({ collections, total }: CollectionsTableClientProps) {
  const crud = useCrudState<CollectionRow>()
  const { isPending, run } = useServerAction()
  const [pendingDelete, setPendingDelete] = useState<CollectionRow | null>(null)

  const handleDelete = () => {
    if (!pendingDelete) return
    const collection = pendingDelete
    setPendingDelete(null)
    run(() => deleteCollection(collection.id), {
      successMsg: `"${collection.name}" eliminada`,
      refresh: true,
    })
  }

  const columns: Column<CollectionRow>[] = [
    {
      header: 'Colección',
      render: (c) => (
        <div className="flex items-center gap-3">
          {c.imageUrl ? (
            <img
              src={c.imageUrl}
              alt={c.name}
              className="w-8 h-8 object-cover shrink-0 border border-(--bd)"
            />
          ) : (
            <div className="w-8 h-8 shrink-0 bg-surf border border-(--bd) flex items-center justify-center text-[10px] text-muted font-display font-black">
              {c.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div className={cls.rowName}>{c.name}</div>
            <div className={cls.rowSub}>{c.slug}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Descripción',
      render: (c) => (
        <span className="text-[13px] text-muted line-clamp-1 max-w-xs">{c.description ?? '—'}</span>
      ),
    },
    {
      header: 'Productos',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (c) => <span className={cls.val}>{c.productCount}</span>,
    },
    {
      header: 'Estado',
      render: (c) => (
        <StatusBadge
          config={
            c.active
              ? { label: 'Activa', cls: 'badge-green', outlineCls: 'badge-green-outline' }
              : { label: 'Inactiva', cls: 'badge-red', outlineCls: 'badge-red-outline' }
          }
        />
      ),
    },
    {
      header: 'Acciones',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (c) => (
        <div className="flex gap-1.5 justify-end">
          <Button
            variant="icon"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              crud.openEdit(c)
            }}
            title="Editar"
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="icon"
            size="sm"
            destructive
            disabled={isPending}
            onClick={(e) => {
              e.stopPropagation()
              setPendingDelete(c)
            }}
            title="Eliminar"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="px-8 pt-7 pb-12">
      <PanelHeader
        label="Catálogo"
        title={`${total} colección${total !== 1 ? 'es' : ''}`}
        align="center"
        side={
          <Button variant="accent" size="md" onClick={crud.openNew}>
            <Plus size={15} className="mr-2" /> Nueva colección
          </Button>
        }
      />

      {collections.length === 0 ? (
        <div className="text-center py-16 text-muted text-sm">No se encontraron colecciones.</div>
      ) : (
        <AdminTable
          columns={columns}
          data={collections}
          keyExtractor={(c) => c.id}
          onRowClick={(c) => crud.openViewing(c.id)}
        />
      )}

      <ConfirmModal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="¿Eliminar colección?"
        description={`"${pendingDelete?.name}" se eliminará permanentemente.`}
        isPending={isPending}
      />

      {crud.drawerOpen && (
        <CollectionCrudDrawer
          collection={crud.editing}
          isNew={crud.isNew}
          onClose={crud.closeDrawer}
        />
      )}

      {crud.viewingId && (
        <EntityProductsDrawer
          entityId={crud.viewingId}
          entityName={collections.find((c) => c.id === crud.viewingId)?.name ?? ''}
          entityType="collection"
          onClose={crud.closeViewing}
        />
      )}
    </div>
  )
}
