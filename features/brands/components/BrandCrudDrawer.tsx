'use client'

import { createBrand, updateBrand } from '@/features/brands/actions/brand.actions'
import type { BrandRow } from '@/modules/catalog/repositories/brand.repo'
import { AdminDrawer } from '@/shared/components/AdminDrawer'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { useAutoSlug, useFormEntity, useServerAction } from '@/shared/hooks'
import { cls } from '@/shared/lib/admin-classes'
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
  description: z.string().max(500).optional(),
  imageUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  logoUrl: z.string().url('URL inválida').optional().or(z.literal('')),
})

type FormValues = z.infer<typeof formSchema>

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BrandCrudDrawerProps {
  /** null = crear nuevo */
  brand: BrandRow | null
  isNew: boolean
  onClose: () => void
}

export function BrandCrudDrawer({ brand, isNew, onClose }: BrandCrudDrawerProps) {
  const { isPending, run } = useServerAction()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      imageUrl: '',
      logoUrl: '',
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
    entity: brand,
    reset,
    defaultValues: { name: '', slug: '', description: '', imageUrl: '', logoUrl: '' },
    mapToForm: (b) => ({
      name: b.name,
      slug: b.slug,
      description: b.description ?? '',
      imageUrl: b.imageUrl ?? '',
      logoUrl: b.logoUrl ?? '',
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

        <FormField label="Descripción" error={errors.description?.message}>
          <textarea
            {...register('description')}
            className={cls.input}
            rows={3}
            placeholder="Descripción de la marca..."
          />
        </FormField>

        <FormField label="URL de imagen (banner/perfil)" error={errors.imageUrl?.message}>
          <input {...register('imageUrl')} className={cls.input} placeholder="https://..." />
        </FormField>

        <FormField label="URL de logo" error={errors.logoUrl?.message}>
          <input {...register('logoUrl')} className={cls.input} placeholder="https://..." />
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
    </AdminDrawer>
  )
}
