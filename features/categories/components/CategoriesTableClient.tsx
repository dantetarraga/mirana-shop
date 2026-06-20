'use client'

import { deleteCategory } from '@/features/categories/actions/category.actions'
import { CategoryCrudDrawer } from '@/features/categories/components/CategoryCrudDrawer'
import type { CategoryRow } from '@/features/categories/types'
import { AdminTable, type Column } from '@/shared/components/admin/AdminTable'
import { EntityProductsDrawer } from '@/shared/components/admin/EntityProductsDrawer'
import { PanelHeader } from '@/shared/components/admin/PanelHeader'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal'
import { useEntityCrud } from '@/shared/hooks/admin'
import { cls } from '@/shared/lib/admin/admin-classes'
import { Pencil, Plus, Trash2 } from 'lucide-react'

interface CategoriesTableClientProps {
  categories: CategoryRow[]
  total: number
  allCategories: CategoryRow[]
}

export function CategoriesTableClient({
  categories,
  total,
  allCategories,
}: CategoriesTableClientProps) {
  const crud = useEntityCrud<CategoryRow>(deleteCategory, (c) => `"${c.name}" eliminada`)

  const nameById = Object.fromEntries(categories.map((c) => [c.id, c.name]))

  const columns: Column<CategoryRow>[] = [
    {
      header: 'Categoría',
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
      header: 'Padre',
      render: (c) => (
        <span className="text-[13px] text-muted">
          {c.parentId ? (nameById[c.parentId] ?? '—') : '—'}
        </span>
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
        title={`${total} categoría${total !== 1 ? 's' : ''}`}
        align="center"
        side={
          <Button variant="accent" size="md" onClick={crud.openNew}>
            <Plus size={15} className="mr-2" /> Nueva categoría
          </Button>
        }
      />

      {categories.length === 0 ? (
        <div className="text-center py-16 text-muted text-sm">No se encontraron categorías.</div>
      ) : (
        <AdminTable
          columns={columns}
          data={categories}
          keyExtractor={(c) => c.id}
          onRowClick={(c) => crud.openViewing(c.id)}
        />
      )}

      <ConfirmModal
        open={!!crud.pendingDelete}
        onClose={crud.closeDelete}
        onConfirm={crud.handleDelete}
        title="¿Eliminar categoría?"
        description={`"${crud.pendingDelete?.name}" se eliminará permanentemente.`}
        isPending={crud.isPending}
      />

      {crud.drawerOpen && (
        <CategoryCrudDrawer
          category={crud.editing}
          isNew={crud.isNew}
          allCategories={categories}
          onClose={crud.closeDrawer}
        />
      )}

      {crud.viewingId && (
        <EntityProductsDrawer
          entityId={crud.viewingId}
          entityName={allCategories.find((c) => c.id === crud.viewingId)?.name ?? ''}
          entityType="category"
          allCategories={allCategories.map((c) => ({ id: c.id, name: c.name }))}
          onClose={crud.closeViewing}
        />
      )}
    </div>
  )
}
