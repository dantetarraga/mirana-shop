'use client'

import { syncProductCollections } from '@/features/collections/actions/collection.actions'
import {
  createProduct,
  deleteProduct,
  getCatalogForExport,
  importProducts,
  updateProduct,
} from '@/features/products/actions/product.actions'
import {
  ProductCrudDrawer,
  type SerializedProduct,
} from '@/features/products/components/ProductCrudDrawer'
import type { BrandRow } from '@/features/brands/types'
import type { CategoryRow } from '@/features/categories/types'
import type { CollectionRow } from '@/features/collections/types'
import { AdminTable, type Column } from '@/shared/components/admin/AdminTable'
import { ExcelImportDrawer } from '@/features/products/components/ExcelImportDrawer'
import { PanelHeader } from '@/shared/components/admin/PanelHeader'
import Image from 'next/image'
import { StockBadge } from '@/features/inventory/components/StockBadge'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal'
import { useCrudState, useServerAction } from '@/shared/hooks/admin'
import { cls } from '@/shared/lib/admin/admin-classes'
import type { ImportProductRow } from '@/features/products/schemas/product.schema'
import { productDbSchema } from '@/features/products/schemas/product.schema'
import { FileDown, FileSpreadsheet, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
type ProductFormValues = z.input<typeof productDbSchema>

function getCategoryStripe(slug: string): string {
  const map: Record<string, string> = {
    'figuras-accion': 'stripe-fig',
    lego: 'stripe-lego',
    'modelos-escala': 'stripe-veh',
    anime: 'stripe-fig',
  }
  return map[slug] ?? 'stripe-fig'
}

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Disponible',
  PREORDER: 'Preventa',
  SOLD_OUT: 'Agotado',
  COMING_SOON: 'Próximamente',
  ARCHIVED: 'Archivado',
}

interface ProductsClientProps {
  initialProducts: SerializedProduct[]
  categories: CategoryRow[]
  brands: BrandRow[]
  collections: CollectionRow[]
  total: number
}

// ---------------------------------------------------------------------------
// Isla cliente con el ciclo de vida CRUD completo: header+botones, tabla,
// drawers y confirm modal comparten el mismo estado (useCrudState) y por eso
// viven juntos. Búsqueda, filtros, chips y paginación viven en page.tsx (server).
// ---------------------------------------------------------------------------

export function ProductsClient({
  initialProducts,
  categories,
  brands,
  collections,
  total,
}: ProductsClientProps) {
  const crud = useCrudState<SerializedProduct>()
  const [showImport, setShowImport] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [products, setProducts] = useState<SerializedProduct[]>(initialProducts)
  const { isPending, run } = useServerAction()

  const handleExportPdf = async () => {
    if (exporting) return
    setExporting(true)
    try {
      const res = await getCatalogForExport()
      if (!res.success) {
        toast.error(res.error)
        return
      }
      const { generateCatalogPdf } = await import('@/features/products/lib/catalog-pdf')
      await generateCatalogPdf(res.data)
      toast.success('Catálogo PDF descargado — listo para compartir')
    } catch {
      toast.error('Error al generar el PDF')
    } finally {
      setExporting(false)
    }
  }

  const onSubmit = (
    data: ProductFormValues,
    collectionIds: string[],
    images: { url: string; alt: string }[],
  ) => {
    if (crud.isNew) {
      // Para create: pasar imágenes directamente al action via imageUrl (primera) + sync resto después
      run(() => createProduct({ ...data, imageUrl: images[0]?.url }), {
        successMsg: 'Producto creado',
        onSuccess: async (created) => {
          // Sync colecciones
          if (collectionIds.length > 0) {
            await syncProductCollections(created.id, collectionIds)
          }
          // Sync imágenes adicionales (la primera ya fue creada por createProduct)
          if (images.length > 1) {
            await updateProduct(created.id, {}, images)
          }
          const category = categories.find((c) => c.id === data.categoryId)
          const brand = brands.find((b) => b.id === data.brandId)
          const selectedCollections = collections.filter((c) => collectionIds.includes(c.id))
          setProducts((prev) => [
            {
              id: created.id,
              sku: data.sku,
              slug: created.slug,
              name: data.name,
              price: data.price ?? 0,
              salePrice: data.salePrice != null ? Number(data.salePrice) : null,
              status: data.status ?? 'AVAILABLE',
              featured: data.featured ?? false,
              createdAt: new Date(),
              category: category
                ? { id: category.id, name: category.name, slug: category.slug }
                : { id: data.categoryId, name: '', slug: '' },
              brand: brand
                ? { id: brand.id, name: brand.name, slug: brand.slug }
                : { id: data.brandId, name: '', slug: '' },
              images: images.map((img, i) => ({ id: `tmp-${i}`, url: img.url, alt: img.alt, position: i })),
              inventory: { availableStock: data.stock ?? 0 },
              collections: selectedCollections.map((c) => ({
                collection: { id: c.id, name: c.name, slug: c.slug },
              })),
            },
            ...prev,
          ])
          crud.closeDrawer()
        },
        refresh: true,
      })
    } else if (crud.editing) {
      const id = crud.editing.id
      run(() => updateProduct(id, data, images), {
        successMsg: 'Producto actualizado',
        onSuccess: async () => {
          // Sincroniza colecciones junto con la actualización del producto
          await syncProductCollections(id, collectionIds)
          setProducts((prev) =>
            prev.map((p) =>
              p.id === id
                ? {
                    ...p,
                    name: data.name,
                    sku: data.sku,
                    slug: data.slug,
                    price: data.price ?? p.price,
                    status: data.status ?? p.status,
                    featured: data.featured ?? p.featured,
                    inventory: { availableStock: data.stock ?? p.inventory?.availableStock ?? 0 },
                  }
                : p,
            ),
          )
          crud.closeDrawer()
        },
      })
    }
  }

  const handleDelete = () => {
    if (!crud.pendingDelete) return
    const p = crud.pendingDelete
    crud.closeDelete()
    run(() => deleteProduct(p.id), {
      onSuccess: () => {
        setProducts((prev) => prev.filter((x) => x.id !== p.id))
        toast.success(`"${p.name}" eliminado`)
      },
    })
  }

  const handleImport = (rows: ImportProductRow[]) => {
    run(() => importProducts(rows), {
      onSuccess: (data) => {
        const { created, updated, errors } = data
        toast.success(`${created} creados, ${updated} actualizados`)
        errors.forEach((e) => toast.error(e))
        setShowImport(false)
      },
      refresh: true,
    })
  }

  const columns = useMemo<Column<SerializedProduct>[]>(
    () => [
      {
        header: 'Producto',
        render: (p) => (
          <div className="flex items-center gap-3">
            {p.images[0]?.url ? (
              <Image
                src={p.images[0].url}
                alt={p.images[0].alt ?? p.name}
                width={42}
                height={42}
                className="w-10.5 h-10.5 object-cover shrink-0 border border-(--bd)"
              />
            ) : (
              <div className={`${getCategoryStripe(p.category.slug)} w-10.5 h-10.5 shrink-0`} />
            )}
            <div>
              <div className={cls.rowName}>{p.name}</div>
              <div className={cls.rowSub}>{STATUS_LABELS[p.status] ?? p.status}</div>
            </div>
          </div>
        ),
      },
      { header: 'SKU', className: cls.mono, render: (p) => p.sku },
      { header: 'Categoría', render: (p) => p.category.name },
      { header: 'Marca', render: (p) => p.brand.name },
      { header: 'Precio', className: cls.valGold, render: (p) => `S/ ${p.price.toFixed(2)}` },
      { header: 'Stock', render: (p) => <StockBadge s={p.inventory?.availableStock ?? 0} /> },
      {
        header: 'Colecciones',
        render: (p) =>
          p.collections.length === 0 ? (
            <span className="text-muted text-[12px]">—</span>
          ) : (
            <div className="flex gap-1 flex-wrap">
              {p.collections.slice(0, 2).map(({ collection: c }) => (
                <span
                  key={c.id}
                  className="text-[10px] tracking-[1px] px-2 py-0.5 bg-(--sub) border border-(--bd) text-muted uppercase"
                >
                  {c.name}
                </span>
              ))}
              {p.collections.length > 2 && (
                <span className="text-[10px] text-muted">+{p.collections.length - 2}</span>
              )}
            </div>
          ),
      },
      {
        header: 'Acciones',
        headerClassName: 'text-right',
        className: 'text-right',
        render: (p) => (
          <div className="flex gap-1.5 justify-end">
            <Button
              variant="icon"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                crud.openEdit(p)
              }}
            >
              <Pencil size={14} />
            </Button>
            <Button
              variant="icon"
              size="sm"
              destructive
              onClick={(e) => {
                e.stopPropagation()
                crud.openDelete(p)
              }}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        ),
      },
    ],
    [], // eslint-disable-line react-hooks/exhaustive-deps
  )

  return (
    <>
      <PanelHeader
        label="Catálogo"
        title={`${total} producto${total !== 1 ? 's' : ''}`}
        align="center"
        side={
          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="outline" size="md" onClick={handleExportPdf} disabled={exporting}>
              <FileDown size={15} className="mr-1.5" />
              {exporting ? 'Generando…' : 'Exportar PDF'}
            </Button>
            <Button variant="outline" size="md" onClick={() => setShowImport(true)}>
              <FileSpreadsheet size={15} className="mr-1.5" /> Importar Excel
            </Button>
            <Button variant="accent" size="md" onClick={crud.openNew}>
              <Plus size={15} className="mr-1.5" /> Nuevo producto
            </Button>
          </div>
        }
      />

      <AdminTable
        columns={columns}
        data={products}
        keyExtractor={(p) => p.id}
        onRowClick={crud.openEdit}
      />

      <ConfirmModal
        open={!!crud.pendingDelete}
        onClose={crud.closeDelete}
        onConfirm={handleDelete}
        title="¿Eliminar producto?"
        description={`"${crud.pendingDelete?.name}" se eliminará permanentemente. Esta acción no se puede deshacer.`}
        isPending={isPending}
      />

      {showImport && (
        <ExcelImportDrawer
          categories={categories}
          brands={brands}
          onClose={() => setShowImport(false)}
          onImport={handleImport}
        />
      )}

      {crud.drawerOpen && (
        <ProductCrudDrawer
          product={crud.editing}
          isNew={crud.isNew}
          categories={categories}
          brands={brands}
          collections={collections}
          onClose={crud.closeDrawer}
          onSubmit={onSubmit}
          isPending={isPending}
        />
      )}
    </>
  )
}
