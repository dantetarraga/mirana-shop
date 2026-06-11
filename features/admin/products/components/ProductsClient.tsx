'use client'

import { syncProductCollections } from '@/features/admin/collections/actions/collection.actions'
import {
  createProduct,
  deleteProduct,
  importProducts,
  updateProduct,
} from '@/features/admin/products/actions/product.actions'
import {
  ProductCrudDrawer,
  type SerializedProduct,
} from '@/features/admin/products/components/ProductCrudDrawer'
import type { BrandRow } from '@/modules/catalog/repositories/brand.repo'
import type { CategoryRow } from '@/modules/catalog/repositories/category.repo'
import type { CollectionRow } from '@/modules/catalog/repositories/collection.repo'
import { AdminTable, type Column } from '@/shared/components/admin/AdminTable'
import { ExcelImportDrawer } from '@/shared/components/admin/ExcelImportDrawer'
import { FilterMultiSelect } from '@/shared/components/admin/FilterMultiSelect'
import { PanelHeader } from '@/shared/components/admin/PanelHeader'
import { ServerSearchForm } from '@/shared/components/admin/ServerSearchForm'
import { StockBadge } from '@/shared/components/admin/StockBadge'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal'
import { useCrudState, useServerAction } from '@/shared/hooks/admin'
import { cls } from '@/shared/lib/admin/admin-classes'
import type { ImportProductRow } from '@/shared/lib/schemas'
import { productDbSchema } from '@/shared/lib/schemas'
import { cn } from '@/shared/lib/utils'
import { FileSpreadsheet, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
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

function buildUrl(params: Record<string, string | string[] | undefined>) {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (!v) continue
    const val = Array.isArray(v) ? v.join(',') : v
    if (val) p.set(k, val)
  }
  const qs = p.toString()
  return qs ? `/admin/products?${qs}` : '/admin/products'
}

interface ProductsClientProps {
  initialProducts: SerializedProduct[]
  categories: CategoryRow[]
  brands: BrandRow[]
  collections: CollectionRow[]
  total: number
  currentPage: number
  perPage: number
  currentQ: string
  currentCats: string[]
  currentBrands: string[]
  currentCollections: string[]
}

export function ProductsClient({
  initialProducts,
  categories,
  brands,
  collections,
  total,
  currentPage,
  perPage,
  currentQ,
  currentCats,
  currentBrands,
  currentCollections,
}: ProductsClientProps) {
  const crud = useCrudState<SerializedProduct>()
  const [showImport, setShowImport] = useState(false)
  const [products, setProducts] = useState<SerializedProduct[]>(initialProducts)
  const { isPending, run } = useServerAction()
  const router = useRouter()

  const totalPages = Math.ceil(total / perPage)

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

  const hasFilters =
    currentQ !== '' ||
    currentCats.length > 0 ||
    currentBrands.length > 0 ||
    currentCollections.length > 0

  const columns = useMemo<Column<SerializedProduct>[]>(
    () => [
      {
        header: 'Producto',
        render: (p) => (
          <div className="flex items-center gap-3">
            <div className={`${getCategoryStripe(p.category.slug)} w-10.5 h-10.5`} />
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
    <div className="px-8 pt-7 pb-12">
      <PanelHeader
        label="Catálogo"
        title={`${total} producto${total !== 1 ? 's' : ''}`}
        align="center"
        side={
          <div className="flex gap-2">
            <Button variant="outline" size="md" onClick={() => setShowImport(true)}>
              <FileSpreadsheet size={15} className="mr-1.5" /> Importar Excel
            </Button>
            <Button variant="accent" size="md" onClick={crud.openNew}>
              <Plus size={15} className="mr-1.5" /> Nuevo producto
            </Button>
          </div>
        }
      />

      {/* Filtros */}
      <div className="flex flex-col gap-2.5 mb-4.5">
        {/* Fila: búsqueda + selects + limpiar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <ServerSearchForm
            placeholder="Buscar producto o SKU..."
            defaultValue={currentQ}
            paramName="q"
            extraParams={{
              ...(currentCats.length > 0 && { cat: currentCats.join(',') }),
              ...(currentBrands.length > 0 && { brand: currentBrands.join(',') }),
              ...(currentCollections.length > 0 && { collection: currentCollections.join(',') }),
            }}
          />
          <FilterMultiSelect
            label="Categoría"
            options={categories.map((c) => ({ label: c.name, value: c.slug }))}
            selected={currentCats}
            onToggle={(val) => {
              const next = currentCats.includes(val)
                ? currentCats.filter((v) => v !== val)
                : [...currentCats, val]
              router.push(
                buildUrl({
                  q: currentQ || undefined,
                  cat: next.length > 0 ? next : undefined,
                  brand: currentBrands.length > 0 ? currentBrands : undefined,
                  collection: currentCollections.length > 0 ? currentCollections : undefined,
                }),
              )
            }}
          />
          <FilterMultiSelect
            label="Marca"
            options={brands.map((b) => ({ label: b.name, value: b.slug }))}
            selected={currentBrands}
            onToggle={(val) => {
              const next = currentBrands.includes(val)
                ? currentBrands.filter((v) => v !== val)
                : [...currentBrands, val]
              router.push(
                buildUrl({
                  q: currentQ || undefined,
                  cat: currentCats.length > 0 ? currentCats : undefined,
                  brand: next.length > 0 ? next : undefined,
                  collection: currentCollections.length > 0 ? currentCollections : undefined,
                }),
              )
            }}
          />
          <FilterMultiSelect
            label="Colección"
            options={collections.map((c) => ({ label: c.name, value: c.slug }))}
            selected={currentCollections}
            onToggle={(val) => {
              const next = currentCollections.includes(val)
                ? currentCollections.filter((v) => v !== val)
                : [...currentCollections, val]
              router.push(
                buildUrl({
                  q: currentQ || undefined,
                  cat: currentCats.length > 0 ? currentCats : undefined,
                  brand: currentBrands.length > 0 ? currentBrands : undefined,
                  collection: next.length > 0 ? next : undefined,
                }),
              )
            }}
          />
          {hasFilters && (
            <a
              href="/admin/products"
              className="ml-auto text-[11px] text-muted hover:text-text transition-colors underline underline-offset-2 whitespace-nowrap"
            >
              Limpiar todo
            </a>
          )}
        </div>

        {/* Chips de filtros activos */}
        {hasFilters && (
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-[10px] uppercase tracking-widest text-muted font-bold font-display">
              Activos:
            </span>
            {currentQ && (
              <a
                href={buildUrl({
                  cat: currentCats.length > 0 ? currentCats : undefined,
                  brand: currentBrands.length > 0 ? currentBrands : undefined,
                  collection: currentCollections.length > 0 ? currentCollections : undefined,
                })}
                className="group flex items-center gap-1.5 px-2.5 py-1 bg-(--sub) border border-(--bd) hover:border-(--gold) transition-colors"
              >
                <span className="text-[11px] text-muted">Búsqueda:</span>
                <span className="text-[11px] text-text font-semibold">{currentQ}</span>
                <X size={10} className="text-muted group-hover:text-(--gold) transition-colors" />
              </a>
            )}
            {currentCats.map((slug) => {
              const name = categories.find((c) => c.slug === slug)?.name ?? slug
              const remaining = currentCats.filter((s) => s !== slug)
              return (
                <a
                  key={`cat-${slug}`}
                  href={buildUrl({
                    q: currentQ || undefined,
                    cat: remaining.length > 0 ? remaining : undefined,
                    brand: currentBrands.length > 0 ? currentBrands : undefined,
                    collection: currentCollections.length > 0 ? currentCollections : undefined,
                  })}
                  className="group flex items-center gap-1.5 px-2.5 py-1 bg-(--sub) border border-(--bd) hover:border-(--gold) transition-colors"
                >
                  <span className="text-[11px] text-muted">Cat:</span>
                  <span className="text-[11px] text-text font-semibold">{name}</span>
                  <X size={10} className="text-muted group-hover:text-(--gold) transition-colors" />
                </a>
              )
            })}
            {currentBrands.map((slug) => {
              const name = brands.find((b) => b.slug === slug)?.name ?? slug
              const remaining = currentBrands.filter((s) => s !== slug)
              return (
                <a
                  key={`brd-${slug}`}
                  href={buildUrl({
                    q: currentQ || undefined,
                    cat: currentCats.length > 0 ? currentCats : undefined,
                    brand: remaining.length > 0 ? remaining : undefined,
                    collection: currentCollections.length > 0 ? currentCollections : undefined,
                  })}
                  className="group flex items-center gap-1.5 px-2.5 py-1 bg-(--sub) border border-(--bd) hover:border-(--gold) transition-colors"
                >
                  <span className="text-[11px] text-muted">Marca:</span>
                  <span className="text-[11px] text-text font-semibold">{name}</span>
                  <X size={10} className="text-muted group-hover:text-(--gold) transition-colors" />
                </a>
              )
            })}
            {currentCollections.map((slug) => {
              const name = collections.find((c) => c.slug === slug)?.name ?? slug
              const remaining = currentCollections.filter((s) => s !== slug)
              return (
                <a
                  key={`col-${slug}`}
                  href={buildUrl({
                    q: currentQ || undefined,
                    cat: currentCats.length > 0 ? currentCats : undefined,
                    brand: currentBrands.length > 0 ? currentBrands : undefined,
                    collection: remaining.length > 0 ? remaining : undefined,
                  })}
                  className="group flex items-center gap-1.5 px-2.5 py-1 bg-(--sub) border border-(--bd) hover:border-(--gold) transition-colors"
                >
                  <span className="text-[11px] text-muted">Col:</span>
                  <span className="text-[11px] text-text font-semibold">{name}</span>
                  <X size={10} className="text-muted group-hover:text-(--gold) transition-colors" />
                </a>
              )
            })}
          </div>
        )}
      </div>

      <AdminTable
        columns={columns}
        data={products}
        keyExtractor={(p) => p.id}
        onRowClick={crud.openEdit}
      />

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex gap-2 justify-end mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={buildUrl({
                q: currentQ || undefined,
                cat: currentCats.length > 0 ? currentCats : undefined,
                brand: currentBrands.length > 0 ? currentBrands : undefined,
                collection: currentCollections.length > 0 ? currentCollections : undefined,
                page: String(p),
              })}
              className={cn(
                'px-3 py-1.5 text-[13px] border transition-colors',
                p === currentPage
                  ? 'bg-(--gold) border-(--gold) text-black font-bold'
                  : 'border-(--bd) text-muted hover:text-text',
              )}
            >
              {p}
            </a>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!crud.pendingDelete}
        onClose={crud.closeDelete}
        onConfirm={handleDelete}
        title="¿Eliminar producto?"
        description={`"${crud.pendingDelete?.name}" se eliminará permanentemente. Esta acción no se puede deshacer.`}
        isPending={isPending}
      />

      {showImport && (
        <ExcelImportDrawer onClose={() => setShowImport(false)} onImport={handleImport} />
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
    </div>
  )
}
