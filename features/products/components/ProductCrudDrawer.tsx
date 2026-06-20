'use client'

import type { BrandRow } from '@/modules/catalog/repositories/brand.repo'
import type { CategoryRow } from '@/modules/catalog/repositories/category.repo'
import type { CollectionRow } from '@/modules/catalog/repositories/collection.repo'
import type { ProductListItem } from '@/modules/catalog/repositories/product.repo'
import { AdminDrawer } from '@/shared/components/admin/AdminDrawer'
import { FilterMultiSelect } from '@/shared/components/admin/FilterMultiSelect'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { useAutoSlug, useFormEntity } from '@/shared/hooks/admin'
import { cls } from '@/shared/lib/admin/admin-classes'
import { productDbSchema } from '@/shared/lib/schemas'
import { cn } from '@/shared/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

type ProductFormValues = z.input<typeof productDbSchema>

export type SerializedProduct = Omit<ProductListItem, 'price' | 'compareAtPrice' | 'salePrice'> & {
  price: number
  compareAtPrice: number | null
  salePrice: number | null
  collections: { collection: { id: string; name: string; slug: string } }[]
}

const EMPTY_FORM: ProductFormValues = {
  name: '',
  slug: '',
  sku: '',
  description: '',
  price: 0,
  salePrice: undefined,
  stock: 0,
  categoryId: '',
  brandId: '',
  status: 'AVAILABLE',
  featured: false,
}

interface ProductCrudDrawerProps {
  product: SerializedProduct | null
  isNew: boolean
  categories: CategoryRow[]
  brands: BrandRow[]
  collections: CollectionRow[]
  onClose: () => void
  /** collectionIds = IDs seleccionados en el multi-select */
  onSubmit: (
    data: ProductFormValues,
    collectionIds: string[],
    images: { url: string; alt: string }[],
  ) => void
  isPending: boolean
}

export function ProductCrudDrawer({
  product,
  isNew,
  categories,
  brands,
  collections,
  onClose,
  onSubmit,
  isPending,
}: ProductCrudDrawerProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productDbSchema),
    defaultValues: EMPTY_FORM,
  })

  // IDs de colecciones seleccionadas — estado separado del form (M2M)
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([])

  // Imágenes — estado separado del form (múltiples, ordenadas)
  const [imageInputs, setImageInputs] = useState<{ url: string; alt: string }[]>([])

  useFormEntity({
    entity: product,
    reset,
    defaultValues: {
      ...EMPTY_FORM,
      categoryId: categories[0]?.id ?? '',
      brandId: brands[0]?.id ?? '',
    },
    mapToForm: (p) => ({
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      description: (p as SerializedProduct & { description?: string }).description ?? '',
      price: p.price,
      compareAtPrice: p.compareAtPrice ?? undefined,
      salePrice: p.salePrice ?? undefined,
      stock: p.inventory?.availableStock ?? 0,
      categoryId: p.category.id,
      brandId: p.brand.id,
      status: p.status,
      featured: p.featured,
    }),
  })

  // Sincroniza colecciones e imágenes cuando cambia el producto seleccionado
  useEffect(() => {
    setSelectedCollectionIds(product ? product.collections.map((c) => c.collection.id) : [])
    setImageInputs(product?.images.map((img) => ({ url: img.url, alt: img.alt ?? '' })) ?? [])
  }, [product?.id])

  const addImage = useCallback(() => {
    setImageInputs((prev) => [...prev, { url: '', alt: '' }])
  }, [])

  const removeImage = useCallback((i: number) => {
    setImageInputs((prev) => prev.filter((_, idx) => idx !== i))
  }, [])

  const updateImage = useCallback((i: number, field: 'url' | 'alt', value: string) => {
    setImageInputs((prev) => prev.map((img, idx) => (idx === i ? { ...img, [field]: value } : img)))
  }, [])

  const toggleCollection = (id: string) => {
    setSelectedCollectionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const watchedPrice = watch('price')
  const watchedSalePrice = watch('salePrice')
  useAutoSlug({ name: watch('name'), isNew, setValue })

  const discount =
    typeof watchedSalePrice === 'number' && watchedPrice > 0 && watchedSalePrice < watchedPrice
      ? Math.round(((watchedPrice - watchedSalePrice) / watchedPrice) * 100)
      : null

  const handleFormSubmit = (data: ProductFormValues) => {
    // Filtra imágenes con URL vacía antes de enviar
    const validImages = imageInputs.filter((img) => img.url.trim() !== '')
    onSubmit(data, selectedCollectionIds, validImages)
  }

  return (
    <AdminDrawer
      title={isNew ? 'Nuevo producto' : (product?.name ?? 'Editar producto')}
      sub={isNew ? 'Crear producto' : 'Editar producto'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="flex flex-col gap-4.5">
        {/* ── Nombre ── */}
        <FormField label="Nombre" error={errors.name?.message}>
          <input {...register('name')} className={cls.input} placeholder="Nombre del producto" />
        </FormField>

        {/* ── SKU + Slug ── */}
        <div className="grid grid-cols-2 gap-3.5">
          <FormField label="SKU" error={errors.sku?.message}>
            <input {...register('sku')} className={cls.input} placeholder="FIG-MAR-001" />
          </FormField>
          <FormField label="Slug" error={errors.slug?.message}>
            <input {...register('slug')} className={cls.input} placeholder="nombre-del-producto" />
          </FormField>
        </div>

        {/* ── Precios ── */}
        <div className="grid grid-cols-2 gap-3.5">
          <FormField label="Precio base (S/)" error={errors.price?.message}>
            <input
              {...register('price', { valueAsNumber: true })}
              type="number"
              step="0.01"
              className={cls.input}
              placeholder="0.00"
            />
          </FormField>
          <div className="flex flex-col gap-1">
            <FormField label="Precio de venta (S/)" error={errors.salePrice?.message}>
              <input
                {...register('salePrice', { valueAsNumber: true })}
                type="number"
                step="0.01"
                className={cls.input}
                placeholder="Opcional"
              />
            </FormField>
            {discount !== null && (
              <p className="text-[11px] font-semibold text-[#3fcf7f]">−{discount}% de descuento</p>
            )}
          </div>
        </div>

        {/* ── Stock ── */}
        <FormField label="Stock" error={errors.stock?.message}>
          <input
            {...register('stock', { valueAsNumber: true })}
            type="number"
            className={cls.input}
            placeholder="0"
          />
        </FormField>

        {/* ── Categoría + Marca ── */}
        <div className="grid grid-cols-2 gap-3.5">
          <FormField label="Categoría" error={errors.categoryId?.message}>
            <FilterMultiSelect
              singleSelect
              label="Categoría"
              className="w-full"
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
              selected={watch('categoryId') ? [watch('categoryId')] : []}
              onToggle={(val) => setValue('categoryId', val, { shouldValidate: true })}
            />
          </FormField>
          <FormField label="Marca" error={errors.brandId?.message}>
            <FilterMultiSelect
              singleSelect
              label="Marca"
              className="w-full"
              options={brands.map((b) => ({ label: b.name, value: b.id }))}
              selected={watch('brandId') ? [watch('brandId')] : []}
              onToggle={(val) => setValue('brandId', val, { shouldValidate: true })}
            />
          </FormField>
        </div>

        {/* ── Imágenes ── */}
        <div>
          <div className={cn(cls.label, 'mb-2')}>Imágenes</div>
          <div className="flex flex-col gap-2">
            {imageInputs.map((img, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 flex flex-col gap-1.5">
                  <input
                    value={img.url}
                    onChange={(e) => updateImage(i, 'url', e.target.value)}
                    className={cls.input}
                    placeholder={`URL imagen ${i + 1}`}
                    type="url"
                  />
                  <input
                    value={img.alt}
                    onChange={(e) => updateImage(i, 'alt', e.target.value)}
                    className={cn(cls.input, 'text-[12px] py-1.75')}
                    placeholder="Texto alternativo (opcional)"
                  />
                </div>
                <Button
                  type="button"
                  variant="icon"
                  size="sm"
                  destructive
                  onClick={() => removeImage(i)}
                  className="mt-0.75"
                >
                  <Trash2 size={13} />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addImage}
              className="self-start"
            >
              <ImagePlus size={14} />
              Agregar imagen
            </Button>
          </div>
        </div>

        {/* ── Colecciones (M2M) ── */}
        {collections.length > 0 && (
          <div>
            <div className={cn(cls.label, 'mb-2')}>Colecciones</div>
            <div className="border border-(--bd) divide-y divide-(--bd) max-h-45 overflow-y-auto">
              {collections.map((col) => {
                const checked = selectedCollectionIds.includes(col.id)
                return (
                  <label
                    key={col.id}
                    className="flex items-center gap-3 px-3.5 py-2.5 cursor-pointer hover:bg-white/2 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCollection(col.id)}
                      className="accent-(--gold) w-3.5 h-3.5 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold truncate">{col.name}</div>
                      {col.description && (
                        <div className="text-[11px] text-muted truncate">{col.description}</div>
                      )}
                    </div>
                    <span className={cn(cls.mono, 'ml-auto shrink-0 text-[11px]')}>
                      {col.productCount} prod.
                    </span>
                  </label>
                )
              })}
            </div>
            {selectedCollectionIds.length > 0 && (
              <p className="text-[11px] text-muted mt-1.5">
                {selectedCollectionIds.length} colección
                {selectedCollectionIds.length !== 1 ? 'es' : ''} seleccionada
                {selectedCollectionIds.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        {/* ── Estado + Destacado ── */}
        <div className="grid grid-cols-2 gap-3.5">
          <FormField label="Estado" error={errors.status?.message}>
            <FilterMultiSelect
              singleSelect
              label="Estado"
              className="w-full"
              options={[
                { label: 'Disponible', value: 'AVAILABLE' },
                { label: 'Preventa', value: 'PREORDER' },
                { label: 'Agotado', value: 'SOLD_OUT' },
                { label: 'Próximamente', value: 'COMING_SOON' },
                { label: 'Archivado', value: 'ARCHIVED' },
              ]}
              selected={watch('status') ? [watch('status')] : []}
              onToggle={(val) =>
                setValue('status', val as ProductFormValues['status'], { shouldValidate: true })
              }
            />
          </FormField>
          <FormField label="Destacado">
            <FilterMultiSelect
              singleSelect
              label="Destacado"
              className="w-full"
              options={[
                { label: 'No', value: 'false' },
                { label: 'Sí', value: 'true' },
              ]}
              selected={[String(watch('featured'))]}
              onToggle={(val) => setValue('featured', val === 'true', { shouldValidate: true })}
            />
          </FormField>
        </div>

        {/* ── Descripción ── */}
        <FormField label="Descripción" error={errors.description?.message}>
          <textarea {...register('description')} rows={3} className={cn(cls.input, 'resize-y')} />
        </FormField>

        <div className="flex gap-2.5">
          <Button type="submit" variant="accent" size="md" full disabled={isPending}>
            {isPending ? 'Guardando...' : 'Guardar'}
          </Button>
          <Button type="button" variant="outline" size="md" full onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </AdminDrawer>
  )
}
