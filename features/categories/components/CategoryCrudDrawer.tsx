'use client'

import { createCategory, updateCategory } from '@/features/categories/actions/category.actions'
import { MAX_CATEGORY_DEPTH } from '@/features/categories/lib/menu-limits'
import type { CategoryRow } from '@/features/categories/types'
import { AdminDrawer } from '@/shared/components/admin/AdminDrawer'
import { EntityProductsPanel } from '@/shared/components/admin/EntityProductsPanel'
import { FilterMultiSelect } from '@/shared/components/admin/FilterMultiSelect'
import { ImageUploadField } from '@/shared/components/admin/ImageUploadField'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Switch } from '@/shared/components/ui/Switch'
import { useAutoSlug } from '@/shared/hooks/admin/useAutoSlug'
import { useFormEntity } from '@/shared/hooks/admin/useFormEntity'
import { useServerAction } from '@/shared/hooks/admin/useServerAction'
import { cls } from '@/shared/lib/admin/admin-classes'
import { SLUG_PATTERN } from '@/shared/lib/slug'
import { imageUrlSchema } from '@/shared/schemas/image-url.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Schema del formulario
// ---------------------------------------------------------------------------

const formSchema = z.object({
  name: z.string().trim().min(1, 'Nombre requerido').max(100),
  slug: z.string().min(1, 'Slug requerido').regex(SLUG_PATTERN, 'Solo minúsculas, números y guiones'),
  parentId: z.string().optional(),
  description: z.string().max(500).optional(),
  imageUrl: imageUrlSchema('URL inválida').optional().or(z.literal('')),
  isVisible: z.boolean(),
  showInMenu: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CategoryCrudDrawerProps {
  category: CategoryRow | null
  isNew: boolean
  /** Todas las categorías vivas: de aquí salen los padres posibles. */
  allCategories: CategoryRow[]
  /** "Añadir subcategoría": padre preseleccionado al crear. */
  defaultParentId?: string | null
  onClose: () => void
}

export function CategoryCrudDrawer({
  category,
  isNew,
  allCategories,
  defaultParentId = null,
  onClose,
}: CategoryCrudDrawerProps) {
  const { isPending, run } = useServerAction()

  const defaults: FormValues = {
    name: '',
    slug: '',
    parentId: defaultParentId ?? '',
    description: '',
    imageUrl: '',
    isVisible: true,
    showInMenu: !defaultParentId,
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaults,
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = form

  useAutoSlug({ name: watch('name'), isNew, setValue })

  useFormEntity({
    entity: category,
    reset,
    defaultValues: defaults,
    mapToForm: (c) => ({
      name: c.name,
      slug: c.slug,
      parentId: c.parentId ?? '',
      description: c.description ?? '',
      imageUrl: c.imageUrl ?? '',
      isVisible: c.isVisible,
      showInMenu: c.showInMenu,
    }),
  })

  const parentId = watch('parentId') || ''
  const isChild = parentId !== ''

  // Máx. 2 niveles: solo las raíces pueden ser padre, nunca la propia, y una
  // categoría con hijas tiene que seguir siendo raíz.
  const hasChildren = !!category && allCategories.some((c) => c.parentId === category.id)
  const parentOptions = allCategories.filter((c) => c.parentId === null && c.id !== category?.id)

  const onSubmit = (data: FormValues) => {
    const payload = {
      ...data,
      // Vacío ("") → null para que el UPDATE la convierta en raíz.
      parentId: data.parentId || null,
      showInMenu: data.parentId ? false : data.showInMenu,
      ...(category && { id: category.id }),
    }
    run(category ? () => updateCategory(payload) : () => createCategory(payload), {
      successMsg: isNew ? 'Categoría creada' : 'Categoría actualizada',
      onSuccess: () => onClose(),
      refresh: true,
    })
  }

  const parentName = allCategories.find((c) => c.id === defaultParentId)?.name

  return (
    <AdminDrawer
      title={isNew ? (parentName ? 'Nueva subcategoría' : 'Nueva categoría') : (category?.name ?? 'Categoría')}
      sub={isNew ? (parentName ? `Dentro de ${parentName}` : 'Crear categoría') : 'Editar categoría'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4.5">
        <FormField label="Nombre" error={errors.name?.message}>
          <input {...register('name')} className={cls.input} placeholder="Figuras de Acción" />
        </FormField>

        <FormField
          label="Slug (URL)"
          error={errors.slug?.message}
          hint="Único en toda la tienda: /categorias/slug"
        >
          <input {...register('slug')} className={cls.input} placeholder="figuras-accion" />
        </FormField>

        <FormField
          label="Categoría padre"
          error={errors.parentId?.message}
          hint={
            hasChildren
              ? `Tiene subcategorías: debe seguir siendo principal (máx. ${MAX_CATEGORY_DEPTH} niveles).`
              : 'Vacío = categoría principal. Solo las principales pueden tener subcategorías.'
          }
        >
          {hasChildren ? (
            <div className={`${cls.input} text-muted`}>Categoría principal</div>
          ) : (
            <FilterMultiSelect
              singleSelect
              label="Categoría padre"
              className="w-full"
              options={[
                { label: 'Ninguna (categoría principal)', value: '' },
                ...parentOptions.map((c) => ({ label: c.name, value: c.id })),
              ]}
              selected={[parentId]}
              onToggle={(val) => setValue('parentId', val, { shouldValidate: true })}
            />
          )}
        </FormField>

        <div className="flex flex-col gap-3 border border-(--bd) p-3.5">
          <Switch
            showLabel
            size="md"
            label="Visible en la tienda"
            checked={watch('isVisible')}
            onChange={(v) => setValue('isVisible', v)}
          />
          <Switch
            showLabel
            size="md"
            label="Mostrar en el menú"
            checked={!isChild && watch('showInMenu')}
            disabled={isChild}
            onChange={(v) => setValue('showInMenu', v)}
          />
          <p className="text-[11px] text-muted">
            {isChild
              ? 'Las subcategorías aparecen bajo su padre, ordenadas como en el árbol.'
              : 'El menú solo lista categorías principales con productos visibles.'}
          </p>
        </div>

        <FormField label="Descripción" error={errors.description?.message}>
          <textarea
            {...register('description')}
            className={cls.input}
            rows={3}
            placeholder="Se muestra en la cabecera de la página de la categoría."
          />
        </FormField>

        <FormField label="Imagen" error={errors.imageUrl?.message}>
          <ImageUploadField
            value={watch('imageUrl') ?? ''}
            onChange={(url) => setValue('imageUrl', url, { shouldValidate: true })}
            folder="categories"
          />
        </FormField>

        <div className="flex gap-2.5 pt-1">
          <Button type="submit" variant="accent" size="md" full loading={isPending} loadingText="Guardando…">
            {isNew ? 'Crear categoría' : 'Guardar cambios'}
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
