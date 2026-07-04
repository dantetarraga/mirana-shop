'use client'

import { deleteBrand, importBrands } from '@/features/brands/actions/brand.actions'
import { BrandCrudDrawer } from '@/features/brands/components/BrandCrudDrawer'
import type { BrandRow } from '@/features/brands/types'
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
  { key: 'name', label: 'Nombre', aliases: ['nombre', 'marca', 'brand'], required: true },
  { key: 'slug', label: 'Slug', aliases: [], mono: true },
  { key: 'tagline', label: 'Tagline', aliases: ['lema'] },
  {
    key: 'description',
    label: 'Descripcion',
    aliases: ['descripcion', 'descripción', 'desc'],
  },
  {
    key: 'imageUrl',
    label: 'URL Imagen',
    aliases: ['imagen', 'image', 'imagen url', 'image url', 'url imagen', 'logo'],
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

interface BrandsTableClientProps {
  brands: BrandRow[]
  total: number
  allBrands: BrandRow[]
}

export function BrandsTableClient({ brands, total, allBrands }: BrandsTableClientProps) {
  const crud = useEntityCrud<BrandRow>(deleteBrand, (b) => `"${b.name}" eliminada`)
  const [showImport, setShowImport] = useState(false)
  const importer = useServerAction()

  const handleImport = (rows: ImportedRow[]) => {
    importer.run(() => importBrands(rows), {
      onSuccess: (data) => {
        toast.success(`${data.created} creadas, ${data.updated} actualizadas`)
        data.errors.forEach((e) => toast.error(e))
        setShowImport(false)
      },
      refresh: true,
    })
  }

  const columns: Column<BrandRow>[] = [
    {
      header: 'Marca',
      render: (b) => (
        <div className="flex items-center gap-3">
          {b.imageUrl ? (
            <img
              src={b.imageUrl}
              alt={b.name}
              className="w-8 h-8 object-cover shrink-0 border border-(--bd)"
            />
          ) : (
            <div className="w-8 h-8 shrink-0 bg-surf border border-(--bd) flex items-center justify-center text-[10px] text-muted font-display font-black">
              {b.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div className={cls.rowName}>{b.name}</div>
            <div className={cls.rowSub}>{b.slug}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Descripción',
      render: (b) => (
        <span className="text-[13px] text-muted line-clamp-1 max-w-xs">{b.description ?? '—'}</span>
      ),
    },
    {
      header: 'Productos',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (b) => <span className={cls.val}>{b.productCount}</span>,
    },
    {
      header: 'Acciones',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (b) => (
        <div className="flex gap-1.5 justify-end">
          <Button
            variant="icon"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              crud.openEdit(b)
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
              crud.openDelete(b)
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
        title={`${total} marca${total !== 1 ? 's' : ''}`}
        align="center"
        side={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="md" onClick={() => setShowImport(true)}>
              <FileSpreadsheet size={15} className="mr-1.5" /> Importar Excel
            </Button>
            <Button variant="accent" size="md" onClick={crud.openNew}>
              <Plus size={15} className="mr-2" /> Nueva marca
            </Button>
          </div>
        }
      />

      {brands.length === 0 ? (
        <div className="text-center py-16 text-muted text-sm">No se encontraron marcas.</div>
      ) : (
        <AdminTable
          columns={columns}
          data={brands}
          keyExtractor={(b) => b.id}
          onRowClick={(b) => crud.openViewing(b.id)}
        />
      )}

      <ConfirmModal
        open={!!crud.pendingDelete}
        onClose={crud.closeDelete}
        onConfirm={crud.handleDelete}
        title="¿Eliminar marca?"
        description={`"${crud.pendingDelete?.name}" se eliminará permanentemente.`}
        isPending={crud.isPending}
      />

      {crud.drawerOpen && (
        <BrandCrudDrawer brand={crud.editing} isNew={crud.isNew} onClose={crud.closeDrawer} />
      )}

      {showImport && (
        <EntityImportDrawer
          title="Importar marcas"
          entitySingular="marca"
          entityPlural="marcas"
          fields={IMPORT_FIELDS}
          validateRow={validateImportRow}
          templateHref="/plantillas/plantilla-importar-marcas.xlsx"
          onClose={() => setShowImport(false)}
          onImport={handleImport}
        />
      )}

      {crud.viewingId && (
        <EntityProductsDrawer
          entityId={crud.viewingId}
          entityName={brands.find((b) => b.id === crud.viewingId)?.name ?? ''}
          entityType="brand"
          allBrands={allBrands.map((b) => ({ id: b.id, name: b.name }))}
          onClose={crud.closeViewing}
        />
      )}
    </div>
  )
}
