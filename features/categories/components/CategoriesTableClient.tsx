'use client'

import { deleteCategory, importCategories } from '@/features/categories/actions/category.actions'
import { CategoryCrudDrawer } from '@/features/categories/components/CategoryCrudDrawer'
import type { CategoryRow } from '@/features/categories/types'
import { AdminTable, type Column } from '@/shared/components/admin/AdminTable'
import {
  EntityImportDrawer,
  type ImportField,
  type ImportedRow,
} from '@/shared/components/admin/EntityImportDrawer'
import { EntityProductsDrawer } from '@/shared/components/admin/EntityProductsDrawer'
import { PanelHeader } from '@/shared/components/admin/PanelHeader'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal'
import { useEntityCrud, useServerAction } from '@/shared/hooks/admin'
import { cls } from '@/shared/lib/admin/admin-classes'
import { FileSpreadsheet, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

const IMPORT_FIELDS: ImportField[] = [
  { key: 'name', label: 'Nombre', aliases: ['nombre', 'categoria', 'categoría', 'category'], required: true },
  { key: 'slug', label: 'Slug', aliases: [], mono: true },
  {
    key: 'parent',
    label: 'Padre',
    aliases: ['padre', 'categoria padre', 'categoría padre'],
  },
  {
    key: 'description',
    label: 'Descripcion',
    aliases: ['descripcion', 'descripción', 'desc'],
  },
  {
    key: 'imageUrl',
    label: 'URL Imagen',
    aliases: ['imagen', 'image', 'imagen url', 'image url', 'url imagen'],
  },
]

function validateImportRow(data: ImportedRow): string[] {
  const errors: string[] = []
  if (data.slug && !/^[a-z0-9-]+$/.test(data.slug)) {
    errors.push('Slug inválido (minúsculas, números y guiones)')
  }
  if (data.imageUrl) {
    try {
      new URL(data.imageUrl)
    } catch {
      errors.push('URL de imagen inválida')
    }
  }
  return errors
}

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
  const [showImport, setShowImport] = useState(false)
  const importer = useServerAction()

  const handleImport = (rows: ImportedRow[]) => {
    importer.run(() => importCategories(rows), {
      onSuccess: (data) => {
        toast.success(`${data.created} creadas, ${data.updated} actualizadas`)
        data.errors.forEach((e) => toast.error(e))
        setShowImport(false)
      },
      refresh: true,
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
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="md" onClick={() => setShowImport(true)}>
              <FileSpreadsheet size={15} className="mr-1.5" /> Importar Excel
            </Button>
            <Button variant="accent" size="md" onClick={crud.openNew}>
              <Plus size={15} className="mr-2" /> Nueva categoría
            </Button>
          </div>
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

      {showImport && (
        <EntityImportDrawer
          title="Importar categorías"
          entitySingular="categoría"
          entityPlural="categorías"
          fields={IMPORT_FIELDS}
          validateRow={validateImportRow}
          templateHref="/plantillas/plantilla-importar-categorias.xlsx"
          onClose={() => setShowImport(false)}
          onImport={handleImport}
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
