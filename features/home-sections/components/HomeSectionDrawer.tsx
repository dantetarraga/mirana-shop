'use client'

import { saveHomeSection } from '@/features/home-sections/actions/home-section.actions'
import type { HomeSectionRow } from '@/features/home-sections/types'
import { HOME_SECTION_DEFAULT_HREF } from '@/features/home-sections/types'
import { LinkPicker } from '@/features/marketing/components/LinkPicker'
import { AdminDrawer } from '@/shared/components/admin/AdminDrawer'
import { FilterMultiSelect } from '@/shared/components/admin/FilterMultiSelect'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { useFormEntity, useServerAction } from '@/shared/hooks/admin'
import { cls } from '@/shared/lib/admin/admin-classes'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const formSchema = z.object({
  title: z.string().min(1, 'Título requerido').max(80),
  eyebrow: z.string().max(60).optional(),
  ctaHref: z.string().optional(),
  position: z.number().int().min(0),
  active: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

const DEFAULTS: FormValues = {
  title: '',
  eyebrow: '',
  ctaHref: '',
  position: 0,
  active: true,
}

interface HomeSectionDrawerProps {
  section: HomeSectionRow | null
  isNew: boolean
  onClose: () => void
}

export function HomeSectionDrawer({ section, isNew, onClose }: HomeSectionDrawerProps) {
  const { isPending, run } = useServerAction()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULTS,
  })

  useFormEntity({
    entity: section,
    reset,
    defaultValues: DEFAULTS,
    mapToForm: (s) => ({
      title: s.title,
      eyebrow: s.eyebrow,
      ctaHref: s.ctaHref,
      position: s.position,
      active: s.active,
    }),
  })

  const onSubmit = (data: FormValues) => {
    run(() => saveHomeSection(section?.id ?? null, data), {
      successMsg: isNew ? 'Sección creada' : 'Sección actualizada',
      onSuccess: () => onClose(),
      refresh: true,
    })
  }

  return (
    <AdminDrawer
      title={isNew ? 'Nueva sección' : (section?.title ?? 'Sección')}
      sub={isNew ? 'Crear sección del inicio' : 'Editar sección del inicio'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4.5">
        <FormField label="Título" error={errors.title?.message}>
          <input {...register('title')} className={cls.input} placeholder="Lo más vendido" />
        </FormField>

        <FormField label="Antetítulo (opcional)" error={errors.eyebrow?.message}>
          <input
            {...register('eyebrow')}
            className={cls.input}
            placeholder="Selección de la casa"
          />
        </FormField>
        <p className="text-[12px] text-muted -mt-2.5">
          Texto pequeño encima del título, como el &quot;Recién llegados&quot; de Novedades.
        </p>

        <FormField label='Destino del botón "Ver todos"' error={errors.ctaHref?.message}>
          <LinkPicker
            value={watch('ctaHref') ?? ''}
            onChange={(href) => setValue('ctaHref', href, { shouldValidate: true })}
          />
        </FormField>
        <p className="text-[12px] text-muted -mt-2.5">
          Si lo dejas sin enlace, el botón lleva al catálogo ({HOME_SECTION_DEFAULT_HREF}).
        </p>

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
          <FormField label="Visibilidad" error={errors.active?.message}>
            <FilterMultiSelect
              singleSelect
              label="Visibilidad"
              className="w-full"
              options={[
                { label: 'Oculta', value: 'false' },
                { label: 'Visible', value: 'true' },
              ]}
              selected={[String(watch('active'))]}
              onToggle={(val) => setValue('active', val === 'true', { shouldValidate: true })}
            />
          </FormField>
        </div>
        <p className="text-[12px] text-muted -mt-2.5">
          Las secciones se ordenan de menor a mayor. Una sección oculta —o sin productos que
          mostrar— no aparece en el inicio, pero se sigue administrando desde aquí.
        </p>

        <div className="flex gap-2.5 pt-1">
          <Button type="submit" variant="accent" size="md" full disabled={isPending}>
            {isPending ? 'Guardando...' : isNew ? 'Crear sección' : 'Guardar cambios'}
          </Button>
          <Button type="button" variant="outline" size="md" full onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </AdminDrawer>
  )
}
