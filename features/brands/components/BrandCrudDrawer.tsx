'use client'

import { createBrand, updateBrand } from '@/features/brands/actions/brand.actions'
import type { BrandRow } from '@/features/brands/types'
import { AdminDrawer } from '@/shared/components/admin/AdminDrawer'
import { EntityProductsPanel } from '@/shared/components/admin/EntityProductsPanel'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { useAutoSlug, useFormEntity, useServerAction } from '@/shared/hooks/admin'
import { cls } from '@/shared/lib/admin/admin-classes'
import { imageUrlSchema } from '@/shared/schemas/image-url.schema'
import { ImageUploadField } from '@/shared/components/admin/ImageUploadField'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const formSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
  slug: z
    .string()
    .min(1, 'Slug requerido')
    .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  tagline: z.string().max(80).optional(),
  description: z.string().max(500).optional(),
  imageUrl: imageUrlSchema('URL inválida').optional().or(z.literal('')),
})

type FormValues = z.infer<typeof formSchema>

const DEFAULTS: FormValues = { name: '', slug: '', tagline: '', description: '', imageUrl: '' }

interface BrandCrudDrawerProps {
  brand: BrandRow | null
  isNew: boolean
  onClose: () => void
}

export function BrandCrudDrawer({ brand, isNew, onClose }: BrandCrudDrawerProps) {
  const { isPending, run } = useServerAction()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULTS,
  })

  useAutoSlug({ name: watch('name'), isNew, setValue })

  useFormEntity({
    entity: brand,
    reset,
    defaultValues: DEFAULTS,
    mapToForm: (b) => ({
      name: b.name,
      slug: b.slug,
      tagline: b.tagline ?? '',
      description: b.description ?? '',
      imageUrl: b.imageUrl ?? '',
    }),
  })

  const onSubmit = (data: FormValues) => {
    const payload = { ...data, ...(brand && { id: brand.id }) }
    run(brand ? () => updateBrand(payload) : () => createBrand(payload), {
      successMsg: isNew ? 'Marca creada' : 'Marca actualizada',
      onSuccess: () => onClose(),
      refresh: true,
    })
  }

  return (
    <AdminDrawer
      title={isNew ? 'Nueva marca' : (brand?.name ?? 'Marca')}
      sub={isNew ? 'Crear marca' : 'Editar marca'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4.5">
        <FormField label="Nombre" error={errors.name?.message}>
          <input {...register('name')} className={cls.input} placeholder="LEGO Group" />
        </FormField>

        <FormField label="Slug (URL)" error={errors.slug?.message}>
          <input {...register('slug')} className={cls.input} placeholder="lego-group" />
        </FormField>

        <FormField label="Tagline del carrusel" error={errors.tagline?.message}>
          <input
            {...register('tagline')}
            className={cls.input}
            placeholder="OFFICIAL PARTNER · SET COLLECTIONS"
          />
        </FormField>

        <FormField label="Descripción" error={errors.description?.message}>
          <textarea
            {...register('description')}
            className={cls.input}
            rows={3}
            placeholder="Descripción de la marca..."
          />
        </FormField>

        <FormField label="Imagen" error={errors.imageUrl?.message}>
          <ImageUploadField
            value={watch('imageUrl') ?? ''}
            onChange={(url) => setValue('imageUrl', url, { shouldValidate: true })}
            folder="brands"
          />
        </FormField>

        <div className="flex gap-2.5 pt-1">
          <Button type="submit" variant="accent" size="md" full disabled={isPending}>
            {isPending ? 'Guardando...' : isNew ? 'Crear marca' : 'Guardar cambios'}
          </Button>
          <Button type="button" variant="outline" size="md" full onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>

      {!isNew && brand?.id && <EntityProductsPanel entityId={brand.id} entityType="brand" />}
    </AdminDrawer>
  )
}
