'use client'

import { createCategory, updateCategory } from '@/features/admin/categories/actions/category.actions'
import type { CategoryRow } from '@/modules/catalog/repositories/category.repo'
import { AdminDrawer } from '@/shared/components/admin/AdminDrawer'
import { EntityProductsPanel } from '@/shared/components/admin/EntityProductsPanel'
import { FilterMultiSelect } from '@/shared/components/admin/FilterMultiSelect'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { useAutoSlug, useFormEntity, useServerAction } from '@/shared/hooks/admin'
import { cls } from '@/shared/lib/admin/admin-classes'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Schema del formulario
// ---------------------------------------------------------------------------

const formSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
  slug: z
    .string()
    .min(1, 'Slug requerido')
    .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  parentId: z.string().optional(),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url('URL inválida').optional().or(z.literal('')),
})

type FormValues = z.infer<typeof formSchema>

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CategoryCrudDrawerProps {
  category: CategoryRow | null
  isNew: boolean
  /** Lista de categorías disponibles para seleccionar como padre */
  allCategories: CategoryRow[]
  onClose: () => void
}

export function CategoryCrudDrawer({
  category,
  isNew,
  allCategories,
  onClose,
}: CategoryCrudDrawerProps) {
  const { isPending, run } = useServerAction()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      slug: '',
      parentId: '',
      description: '',
      imageUrl: '',
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = form
  const nameValue = watch('name')

  useAutoSlug({ name: nameValue, isNew, setValue })

  useFormEntity({
    entity: category,
    reset,
    defaultValues: { name: '', slug: '', parentId: '', description: '', imageUrl: '' },
    mapToForm: (c) => ({
      name: c.name,
      slug: c.slug,
      parentId: c.parentId ?? '',
      description: c.description ?? '',
      imageUrl: c.imageUrl ?? '',
    }),
  })

  const onSubmit = (data: FormValues) => {
    const payload = {
      ...data,
      parentId: data.parentId || undefined,
      ...(category && { id: category.id }),
    }
    run(category ? () => updateCategory(payload) : () => createCategory(payload), {
      successMsg: isNew ? 'Categoría creada' : 'Categoría actualizada',
      onSuccess: () => onClose(),
      refresh: true,
    })
  }

  // Filtra la categoría actual para que no sea su propio padre
  const parentOptions = allCategories.filter((c) => c.id !== category?.id)

  return (
    <AdminDrawer
      title={isNew ? 'Nueva categoría' : (category?.name ?? 'Categoría')}
      sub={isNew ? 'Crear categoría' : 'Editar categoría'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4.5">
        <FormField label="Nombre" error={errors.name?.message}>
          <input {...register('name')} className={cls.input} placeholder="Figuras de Acción" />
        </FormField>

        <FormField label="Slug (URL)" error={errors.slug?.message}>
          <input {...register('slug')} className={cls.input} placeholder="figuras-accion" />
        </FormField>

        <FormField label="Categoría padre (opcional)" error={errors.parentId?.message}>
          <FilterMultiSelect
            singleSelect
            label="Categoría padre"
            className="w-full"
            options={[
              { label: 'Sin categoría padre', value: '' },
              ...parentOptions.map((c) => ({ label: c.name, value: c.id })),
            ]}
            selected={watch('parentId') ? [watch('parentId')!] : []}
            onToggle={(val) => setValue('parentId', val, { shouldValidate: true })}
          />
        </FormField>

        <FormField label="Descripción" error={errors.description?.message}>
          <textarea
            {...register('description')}
            className={cls.input}
            rows={3}
            placeholder="Descripción de la categoría..."
          />
        </FormField>

        <FormField label="URL de imagen" error={errors.imageUrl?.message}>
          <input {...register('imageUrl')} className={cls.input} placeholder="https://..." />
        </FormField>

        <div className="flex gap-2.5 pt-1">
          <Button type="submit" variant="accent" size="md" full disabled={isPending}>
            {isPending ? 'Guardando...' : isNew ? 'Crear categoría' : 'Guardar cambios'}
          </Button>
          <Button type="button" variant="outline" size="md" full onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>

      {!isNew && category?.id && (
        <EntityProductsPanel entityId={category.id} entityType="category" />
      )}
    </AdminDrawer>
  )
}
