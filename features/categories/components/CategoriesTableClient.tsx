'use client'

import { deleteCategory } from '@/features/categories/actions/category.actions'
import { CategoryCrudDrawer } from '@/features/categories/components/CategoryCrudDrawer'
import { EntityProductsDrawer } from '@/shared/components/EntityProductsDrawer'
import type { CategoryRow } from '@/modules/catalog/repositories/category.repo'
import { AdminTable, type Column } from '@/shared/components/AdminTable'
import { PanelHeader } from '@/shared/components/PanelHeader'
import { Button } from '@/shared/components/ui/Button'
import { cls } from '@/shared/lib/admin-classes'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

interface CategoriesTableClientProps {
  categories: CategoryRow[]
  total: number
  allCategories: CategoryRow[]
}

export function CategoriesTableClient({ categories, total, allCategories }: CategoriesTableClientProps) {
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [isPending, startTransition] = useTransition()

  const drawerOpen = isNew || editingCategory !== null

  const closeDrawer = () => {
    setEditingCategory(null)
    setIsNew(false)
  }

  const handleDelete = (category: CategoryRow) => {
    if (!confirm(`¿Eliminar la categoría "${category.name}"?`)) return
    startTransition(async () => {
      const result = await deleteCategory(category.id)
      if (result.success) {
        toast.success(`"${category.name}" eliminada`)
        window.location.reload()
      } else {
        toast.error(result.error)
      }
    })
  }

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
              setIsNew(false)
              setEditingCategory(c)
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
            onClick={(e) => { e.stopPropagation(); handleDelete(c) }}
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
          <Button
            variant="accent"
            size="md"
            onClick={() => {
              setEditingCategory(null)
              setIsNew(true)
            }}
          >
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
          onRowClick={(c) => { setEditingCategory(null); setViewingId(c.id); }}
        />
      )}

      {drawerOpen && (
        <CategoryCrudDrawer
          category={editingCategory}
          isNew={isNew}
          allCategories={categories}
          onClose={closeDrawer}
        />
      )}

      {viewingId && (
        <EntityProductsDrawer
          entityId={viewingId}
          entityName={allCategories.find((c) => c.id === viewingId)?.name ?? ''}
          entityType="category"
          allCategories={allCategories.map((c) => ({ id: c.id, name: c.name }))}
          onClose={() => setViewingId(null)}
        />
      )}
    </div>
  )
}
