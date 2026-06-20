'use client'

import { deleteCollection } from '@/features/collections/actions/collection.actions'
import { CollectionCrudDrawer } from '@/features/collections/components/CollectionCrudDrawer'
import type { CollectionRow } from '@/features/collections/services/collection.service'
import { AdminTable, type Column } from '@/shared/components/admin/AdminTable'
import { EntityProductsDrawer } from '@/shared/components/admin/EntityProductsDrawer'
import { PanelHeader } from '@/shared/components/admin/PanelHeader'
import { StatusBadge } from '@/features/orders/components/StatusBadge'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal'
import { useEntityCrud } from '@/shared/hooks/admin'
import { cls } from '@/shared/lib/admin/admin-classes'
import { Pencil, Plus, Trash2 } from 'lucide-react'

interface CollectionsTableClientProps {
  collections: CollectionRow[]
  total: number
}

export function CollectionsTableClient({ collections, total }: CollectionsTableClientProps) {
  const crud = useEntityCrud<CollectionRow>(deleteCollection, (c) => `"${c.name}" eliminada`)

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
            disabled={crud.isPending}
            onClick={(e) => {
              e.stopPropagation()
              crud.openDelete(c)
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
        open={!!crud.pendingDelete}
        onClose={crud.closeDelete}
        onConfirm={crud.handleDelete}
        title="¿Eliminar colección?"
        description={`"${crud.pendingDelete?.name}" se eliminará permanentemente.`}
        isPending={crud.isPending}
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
