'use client'

import { bannerDbSchema } from '@/features/banners/schemas/banner.schema'
import type { BannerRow } from '@/features/banners/types'
import { AdminDrawer } from '@/shared/components/admin/AdminDrawer'
import { FilterMultiSelect } from '@/shared/components/admin/FilterMultiSelect'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { useFormEntity } from '@/shared/hooks/admin'
import { cls } from '@/shared/lib/admin/admin-classes'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

type BannerFormValues = z.input<typeof bannerDbSchema>

const EMPTY_FORM = {
  title: '',
  subtitle: '',
  ctaLabel: '',
  ctaHref: '',
  imageUrl: 'https://placehold.co/1200x400/111111/FFFFFF?text=Banner',
  position: 0,
  active: false,
} satisfies BannerFormValues

interface BannerFormDrawerProps {
  banner: BannerRow | null
  isNew: boolean
  onClose: () => void
  onSubmit: (data: BannerFormValues) => void
  isPending: boolean
}

export function BannerFormDrawer({
  banner,
  isNew,
  onClose,
  onSubmit,
  isPending,
}: BannerFormDrawerProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BannerFormValues>({
    resolver: zodResolver(bannerDbSchema),
    defaultValues: EMPTY_FORM,
  })

  // useFormEntity reemplaza el useEffect manual de sincronización
  useFormEntity({
    entity: banner,
    reset,
    defaultValues: EMPTY_FORM,
    mapToForm: (b) => ({
      title: b.title,
      subtitle: b.subtitle ?? '',
      ctaLabel: b.ctaLabel ?? '',
      ctaHref: b.ctaHref ?? '',
      imageUrl: b.imageUrl,
      position: b.position,
      active: b.active,
    }),
  })

  return (
    <AdminDrawer
      title={isNew ? 'Nuevo banner' : (banner?.title ?? 'Banner')}
      sub={isNew ? 'Crear banner' : 'Editar banner'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4.5">
        <FormField label="Título" error={errors.title?.message}>
          <input {...register('title')} className={cls.input} placeholder="Título del banner" />
        </FormField>

        <FormField label="Subtítulo" error={errors.subtitle?.message}>
          <input
            {...register('subtitle')}
            className={cls.input}
            placeholder="Descripción breve..."
          />
        </FormField>

        <FormField label="URL de imagen" error={errors.imageUrl?.message}>
          <input {...register('imageUrl')} className={cls.input} placeholder="https://..." />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <FormField label="Texto botón" error={errors.ctaLabel?.message}>
            <input {...register('ctaLabel')} className={cls.input} placeholder="Ver colección" />
          </FormField>
          <FormField label="URL botón" error={errors.ctaHref?.message}>
            <input {...register('ctaHref')} className={cls.input} placeholder="/catalogo" />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <FormField label="Posición (orden)" error={errors.position?.message}>
            <input
              {...register('position', { valueAsNumber: true })}
              type="number"
              min="0"
              className={cls.input}
              placeholder="0"
            />
          </FormField>
          <FormField label="Estado" error={errors.active?.message}>
            <FilterMultiSelect
              singleSelect
              label="Estado"
              className="w-full"
              options={[
                { label: 'Inactivo', value: 'false' },
                { label: 'Activo', value: 'true' },
              ]}
              selected={[String(watch('active'))]}
              onToggle={(val) => setValue('active', val === 'true', { shouldValidate: true })}
            />
          </FormField>
        </div>

        <div className="flex gap-2.5">
          <Button type="submit" variant="accent" size="md" full disabled={isPending}>
            {isPending ? 'Guardando...' : 'Guardar banner'}
          </Button>
          <Button type="button" variant="outline" size="md" full onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </AdminDrawer>
  )
}
