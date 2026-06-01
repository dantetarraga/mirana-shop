'use client'

import { deleteBrand } from '@/features/brands/actions/brand.actions'
import { BrandCrudDrawer } from '@/features/brands/components/BrandCrudDrawer'
import type { BrandRow } from '@/modules/catalog/repositories/brand.repo'
import { AdminTable, type Column } from '@/shared/components/AdminTable'
import { EntityProductsDrawer } from '@/shared/components/EntityProductsDrawer'
import { PanelHeader } from '@/shared/components/PanelHeader'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal'
import { useCrudState, useServerAction } from '@/shared/hooks'
import { cls } from '@/shared/lib/admin-classes'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface BrandsTableClientProps {
  brands: BrandRow[]
  total: number
  allBrands: BrandRow[]
}

export function BrandsTableClient({ brands, total, allBrands }: BrandsTableClientProps) {
  const crud = useCrudState<BrandRow>()
  const { isPending, run } = useServerAction()
  const [pendingDelete, setPendingDelete] = useState<BrandRow | null>(null)

  const handleDelete = () => {
    if (!pendingDelete) return
    const brand = pendingDelete
    setPendingDelete(null)
    run(() => deleteBrand(brand.id), {
      successMsg: `"${brand.name}" eliminada`,
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
            disabled={isPending}
            onClick={(e) => {
              e.stopPropagation()
              setPendingDelete(b)
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
          <Button variant="accent" size="md" onClick={crud.openNew}>
            <Plus size={15} className="mr-2" /> Nueva marca
          </Button>
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
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="¿Eliminar marca?"
        description={`"${pendingDelete?.name}" se eliminará permanentemente.`}
        isPending={isPending}
      />

      {crud.drawerOpen && (
        <BrandCrudDrawer brand={crud.editing} isNew={crud.isNew} onClose={crud.closeDrawer} />
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
