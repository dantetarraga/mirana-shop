'use client'

import {
  createProduct,
  deleteProduct,
  importProducts,
  updateProduct,
} from '@/features/products/actions/product.actions'
import type { BrandRow } from '@/modules/catalog/repositories/brand.repo'
import type { CategoryRow } from '@/modules/catalog/repositories/category.repo'
import type { ProductListItem } from '@/modules/catalog/repositories/product.repo'
import { AdminDrawer } from '@/shared/components/AdminDrawer'
import { AdminTable, type Column } from '@/shared/components/AdminTable'
import { ExcelImportDrawer } from '@/shared/components/ExcelImportDrawer'
import { ServerSearchForm } from '@/shared/components/ServerSearchForm'
import { StockBadge } from '@/shared/components/StockBadge'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal'
import { FormField } from '@/shared/components/ui/FormField'
import { useServerAction } from '@/shared/hooks'
import { cls } from '@/shared/lib/admin-classes'
import type { ImportProductRow } from '@/shared/lib/schemas'
import { productDbSchema } from '@/shared/lib/schemas'
import { cn } from '@/shared/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { FileSpreadsheet, Pencil, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
type ProductFormValues = z.input<typeof productDbSchema>

// ---------------------------------------------------------------------------
// Tipos serializados
// ---------------------------------------------------------------------------

type SerializedProduct = Omit<ProductListItem, 'price' | 'compareAtPrice'> & {
  price: number
  compareAtPrice: number | null
  collections: { collection: { id: string; name: string; slug: string } }[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function buildUrl(params: Record<string, string | undefined>) {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v) p.set(k, v)
  }
  const qs = p.toString()
  return qs ? `/admin/products?${qs}` : '/admin/products'
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ProductsClientProps {
  initialProducts: SerializedProduct[]
  categories: CategoryRow[]
  brands: BrandRow[]
  total: number
  currentPage: number
  perPage: number
  currentQ: string
  currentCat: string
}

const EMPTY_FORM: ProductFormValues = {
  name: '',
  slug: '',
  sku: '',
  description: '',
  price: 0,
  stock: 0,
  categoryId: '',
  brandId: '',
  status: 'AVAILABLE',
  featured: false,
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProductsClient({
  initialProducts,
  categories,
  brands,
  total,
  currentPage,
  perPage,
  currentQ,
  currentCat,
}: ProductsClientProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<SerializedProduct | null>(null)
  const [products, setProducts] = useState<SerializedProduct[]>(initialProducts)
  const { isPending, run } = useServerAction()

  const totalPages = Math.ceil(total / perPage)

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productDbSchema),
    defaultValues: EMPTY_FORM,
  })
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form

  const editingProduct = useMemo(
    () => products.find((p) => p.id === editingId) ?? null,
    [products, editingId],
  )

  useEffect(() => {
    if (editingProduct) {
      reset({
        name: editingProduct.name,
        slug: editingProduct.slug,
        sku: editingProduct.sku,
        description: (editingProduct as { description?: string }).description ?? '',
        price: editingProduct.price,
        compareAtPrice: editingProduct.compareAtPrice ?? undefined,
        stock: editingProduct.inventory?.availableStock ?? 0,
        categoryId: editingProduct.category.id,
        brandId: editingProduct.brand.id,
        status: editingProduct.status,
        featured: editingProduct.featured,
      })
    } else if (isNew) {
      reset({ ...EMPTY_FORM, categoryId: categories[0]?.id ?? '', brandId: brands[0]?.id ?? '' })
    }
  }, [editingProduct, isNew, reset, categories, brands])

  const openEdit = (p: SerializedProduct) => {
    setIsNew(false)
    setEditingId(p.id)
  }
  const openNew = () => {
    setEditingId(null)
    setIsNew(true)
  }
  const closeDrawer = () => {
    setEditingId(null)
    setIsNew(false)
    reset(EMPTY_FORM)
  }

  const onSubmit = (data: ProductFormValues) => {
    if (isNew) {
      run(() => createProduct(data), {
        successMsg: 'Producto creado',
        onSuccess: () => closeDrawer(),
        refresh: true,
      })
    } else if (editingId) {
      const id = editingId
      run(() => updateProduct(id, data), {
        successMsg: 'Producto actualizado',
        onSuccess: () => {
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
          closeDrawer()
        },
      })
    }
  }

  const handleDelete = () => {
    if (!pendingDelete) return
    const p = pendingDelete
    setPendingDelete(null)
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
                openEdit(p)
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
                setPendingDelete(p)
              }}
            >
              <X size={14} />
            </Button>
          </div>
        ),
      },
    ],
    [],
  ) // eslint-disable-line react-hooks/exhaustive-deps

  const drawerOpen = isNew || editingId !== null

  return (
    <div className="px-8 pt-7 pb-12">
      {/* Filtros server-side */}
      <div className="flex items-center gap-3.5 flex-wrap mb-4">
        <ServerSearchForm
          placeholder="Buscar producto o SKU..."
          defaultValue={currentQ}
          paramName="q"
          extraParams={currentCat && currentCat !== 'all' ? { cat: currentCat } : {}}
        />

        {/* Tabs de categoría — navegación GET */}
        <div className="flex gap-1.5 flex-wrap">
          {[
            { key: 'all', label: 'Todos' },
            ...categories.map((c) => ({ key: c.slug, label: c.name })),
          ].map(({ key, label }) => {
            const isActive = key === currentCat
            const href = buildUrl({
              q: currentQ || undefined,
              cat: key !== 'all' ? key : undefined,
            })
            return (
              <a
                key={key}
                href={href}
                className={cn(
                  'px-3.5 py-2 text-[11px] tracking-[1px] uppercase font-display font-extrabold border transition-colors',
                  isActive
                    ? 'bg-(--gold) border-(--gold) text-black'
                    : 'border-(--bd) text-muted hover:text-text',
                )}
              >
                {label}
              </a>
            )
          })}
        </div>

        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="md" onClick={() => setShowImport(true)}>
            <FileSpreadsheet size={15} /> Importar Excel
          </Button>
          <Button variant="accent" size="md" onClick={openNew}>
            + Nuevo producto
          </Button>
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={products}
        keyExtractor={(p) => p.id}
        onRowClick={openEdit}
      />

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex gap-2 justify-end mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={buildUrl({
                q: currentQ || undefined,
                cat: currentCat !== 'all' ? currentCat : undefined,
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
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="¿Eliminar producto?"
        description={`"${pendingDelete?.name}" se eliminará permanentemente. Esta acción no se puede deshacer.`}
        isPending={isPending}
      />

      {showImport && (
        <ExcelImportDrawer onClose={() => setShowImport(false)} onImport={handleImport} />
      )}

      {drawerOpen && (
        <AdminDrawer
          title={isNew ? 'Nuevo producto' : (editingProduct?.name ?? 'Editar producto')}
          sub={isNew ? 'Crear producto' : 'Editar producto'}
          onClose={closeDrawer}
        >
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4.5">
            <FormField label="Nombre" error={errors.name?.message}>
              <input
                {...register('name')}
                className={cls.input}
                placeholder="Nombre del producto"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3.5">
              <FormField label="SKU" error={errors.sku?.message}>
                <input {...register('sku')} className={cls.input} placeholder="FIG-MAR-001" />
              </FormField>
              <FormField label="Slug" error={errors.slug?.message}>
                <input
                  {...register('slug')}
                  className={cls.input}
                  placeholder="nombre-del-producto"
                />
              </FormField>
              <FormField label="Precio base (S/)" error={errors.price?.message}>
                <input
                  {...register('price', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className={cls.input}
                  placeholder="0.00"
                />
              </FormField>
              <FormField label="Stock" error={errors.stock?.message}>
                <input
                  {...register('stock', { valueAsNumber: true })}
                  type="number"
                  className={cls.input}
                  placeholder="0"
                />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <FormField label="Categoría" error={errors.categoryId?.message}>
                <select {...register('categoryId')} className={cls.input}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Marca" error={errors.brandId?.message}>
                <select {...register('brandId')} className={cls.input}>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <FormField label="Estado" error={errors.status?.message}>
                <select {...register('status')} className={cls.input}>
                  <option value="AVAILABLE">Disponible</option>
                  <option value="PREORDER">Preventa</option>
                  <option value="SOLD_OUT">Agotado</option>
                  <option value="COMING_SOON">Próximamente</option>
                  <option value="ARCHIVED">Archivado</option>
                </select>
              </FormField>
              <FormField label="Destacado">
                <select
                  {...register('featured', { setValueAs: (v) => v === 'true' || v === true })}
                  className={cls.input}
                >
                  <option value="false">No</option>
                  <option value="true">Sí</option>
                </select>
              </FormField>
            </div>
            <FormField label="Descripción" error={errors.description?.message}>
              <textarea
                {...register('description')}
                rows={3}
                className={cn(cls.input, 'resize-y')}
              />
            </FormField>
            <div className="flex gap-2.5">
              <Button type="submit" variant="accent" size="md" full disabled={isPending}>
                {isPending ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button type="button" variant="outline" size="md" full onClick={closeDrawer}>
                Cancelar
              </Button>
            </div>
          </form>
        </AdminDrawer>
      )}
    </div>
  )
}
