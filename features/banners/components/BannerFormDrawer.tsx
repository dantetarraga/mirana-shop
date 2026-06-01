'use client'

import type { BannerRow } from '@/modules/catalog/repositories/banner.repo'
import { AdminDrawer } from '@/shared/components/AdminDrawer'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { cls } from '@/shared/lib/admin-classes'
import { bannerDbSchema } from '@/shared/lib/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
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
  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerDbSchema),
    defaultValues: EMPTY_FORM,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form

  useEffect(() => {
    if (banner) {
      reset({
        title: banner.title,
        subtitle: banner.subtitle ?? '',
        ctaLabel: banner.ctaLabel ?? '',
        ctaHref: banner.ctaHref ?? '',
        imageUrl: banner.imageUrl,
        position: banner.position,
        active: banner.active,
      })
    } else if (isNew) {
      reset(EMPTY_FORM)
    }
  }, [banner, isNew, reset])

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

        <div className="grid grid-cols-2 gap-3.5">
          <FormField label="Texto botón" error={errors.ctaLabel?.message}>
            <input {...register('ctaLabel')} className={cls.input} placeholder="Ver colección" />
          </FormField>
          <FormField label="URL botón" error={errors.ctaHref?.message}>
            <input {...register('ctaHref')} className={cls.input} placeholder="/catalogo" />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
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
            <select
              {...register('active', { setValueAs: (v) => v === 'true' || v === true })}
              className={cls.input}
            >
              <option value="false">Inactivo</option>
              <option value="true">Activo</option>
            </select>
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
