'use client'

import type { BrandRow } from '@/modules/catalog/repositories/brand.repo'
import type { CategoryRow } from '@/modules/catalog/repositories/category.repo'
import type { ProductListItem } from '@/modules/catalog/repositories/product.repo'
import { AdminDrawer } from '@/shared/components/AdminDrawer'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { useFormEntity } from '@/shared/hooks'
import { cls } from '@/shared/lib/admin-classes'
import { productDbSchema } from '@/shared/lib/schemas'
import { cn } from '@/shared/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

type ProductFormValues = z.input<typeof productDbSchema>

export type SerializedProduct = Omit<ProductListItem, 'price' | 'compareAtPrice'> & {
  price: number
  compareAtPrice: number | null
  collections: { collection: { id: string; name: string; slug: string } }[]
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

interface ProductCrudDrawerProps {
  product: SerializedProduct | null
  isNew: boolean
  categories: CategoryRow[]
  brands: BrandRow[]
  onClose: () => void
  onSubmit: (data: ProductFormValues) => void
  isPending: boolean
}

export function ProductCrudDrawer({
  product,
  isNew,
  categories,
  brands,
  onClose,
  onSubmit,
  isPending,
}: ProductCrudDrawerProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productDbSchema),
    defaultValues: EMPTY_FORM,
  })

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
      stock: p.inventory?.availableStock ?? 0,
      categoryId: p.category.id,
      brandId: p.brand.id,
      status: p.status,
      featured: p.featured,
    }),
  })

  return (
    <AdminDrawer
      title={isNew ? 'Nuevo producto' : (product?.name ?? 'Editar producto')}
      sub={isNew ? 'Crear producto' : 'Editar producto'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4.5">
        <FormField label="Nombre" error={errors.name?.message}>
          <input {...register('name')} className={cls.input} placeholder="Nombre del producto" />
        </FormField>

        <div className="grid grid-cols-2 gap-3.5">
          <FormField label="SKU" error={errors.sku?.message}>
            <input {...register('sku')} className={cls.input} placeholder="FIG-MAR-001" />
          </FormField>
          <FormField label="Slug" error={errors.slug?.message}>
            <input {...register('slug')} className={cls.input} placeholder="nombre-del-producto" />
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
