'use client'

import { createBrand, updateBrand } from '@/features/brands/actions/brand.actions'
import type { BrandRow } from '@/features/brands/types'
import { AdminDrawer } from '@/shared/components/admin/AdminDrawer'
import { EntityProductsPanel } from '@/shared/components/admin/EntityProductsPanel'
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
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const formSchema = z.object({
  name: z.string().trim().min(1, 'Nombre requerido').max(100),
  slug: z.string().min(1, 'Slug requerido').regex(SLUG_PATTERN, 'Solo minúsculas, números y guiones'),
  tagline: z.string().max(80).optional(),
  description: z.string().max(500).optional(),
  imageUrl: imageUrlSchema('URL inválida').optional().or(z.literal('')),
  heroUrl: imageUrlSchema('URL inválida').optional().or(z.literal('')),
  isVisible: z.boolean(),
  featured: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

const DEFAULTS: FormValues = {
  name: '',
  slug: '',
  tagline: '',
  description: '',
  imageUrl: '',
  heroUrl: '',
  isVisible: true,
  featured: false,
}

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
      heroUrl: b.heroUrl ?? '',
      isVisible: b.isVisible,
      featured: b.featured,
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
        <BrandCardPreview
          name={watch('name')}
          tagline={watch('tagline') ?? ''}
          logoUrl={watch('imageUrl') ?? ''}
          heroUrl={watch('heroUrl') ?? ''}
        />

        <FormField label="Nombre" error={errors.name?.message}>
          <input {...register('name')} className={cls.input} placeholder="LEGO Group" />
        </FormField>

        <FormField label="Slug (URL)" error={errors.slug?.message} hint="/marcas/slug">
          <input {...register('slug')} className={cls.input} placeholder="lego-group" />
        </FormField>

        <FormField label="Tagline" error={errors.tagline?.message} hint="Línea corta bajo el nombre: carrusel y cabecera.">
          <input {...register('tagline')} className={cls.input} placeholder="Official partner" />
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
            label="Destacada en el menú"
            checked={watch('featured')}
            onChange={(v) => setValue('featured', v)}
          />
          <p className="text-[11px] text-muted">
            Las destacadas aparecen como logos en el menú «Tienda», en el orden de la lista.
          </p>
        </div>

        <FormField label="Descripción" error={errors.description?.message}>
          <textarea
            {...register('description')}
            className={cls.input}
            rows={3}
            placeholder="Se muestra en la página de la marca."
          />
        </FormField>

        <FormField label="Logo" error={errors.imageUrl?.message} hint="Cuadrado, fondo limpio. Se usa en el menú y el carrusel.">
          <ImageUploadField
            value={watch('imageUrl') ?? ''}
            onChange={(url) => setValue('imageUrl', url, { shouldValidate: true })}
            folder="brands"
          />
        </FormField>

        <FormField label="Imagen de cabecera" error={errors.heroUrl?.message} hint="Horizontal (aprox. 1600 × 500). Fondo de la página de la marca.">
          <ImageUploadField
            value={watch('heroUrl') ?? ''}
            onChange={(url) => setValue('heroUrl', url, { shouldValidate: true })}
            folder="brands"
          />
        </FormField>

        <div className="flex gap-2.5 pt-1">
          <Button type="submit" variant="accent" size="md" full loading={isPending} loadingText="Guardando…">
            {isNew ? 'Crear marca' : 'Guardar cambios'}
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

// ---------------------------------------------------------------------------
// Vista previa: cabecera de /marcas/[slug] (hero + logo + nombre + tagline)
// y la celda del carrusel/mega-menú, con lo que hay escrito en el formulario.
// ---------------------------------------------------------------------------

function BrandCardPreview({
  name,
  tagline,
  logoUrl,
  heroUrl,
}: {
  name: string
  tagline: string
  logoUrl: string
  heroUrl: string
}) {
  const displayName = name.trim() || 'Nombre de la marca'
  return (
    <figure className="m-0">
      <figcaption className={cls.label}>Vista previa</figcaption>
      <div className="border border-(--bd) bg-card">
        <div className="relative h-28 overflow-hidden bg-surf">
          {heroUrl ? (
            <>
              <Image src={heroUrl} alt="" fill sizes="440px" className="object-cover" />
              <div aria-hidden className="absolute inset-0 bg-media-scrim/60" />
            </>
          ) : (
            <div aria-hidden className="absolute inset-0 stripe-fig opacity-60" />
          )}
          <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-3">
            <div className="relative size-14 shrink-0 bg-card border border-(--bd) overflow-hidden grid place-items-center">
              {logoUrl ? (
                <Image src={logoUrl} alt="" fill sizes="56px" className="object-cover" />
              ) : (
                <span className="font-display font-black text-[15px] text-muted">
                  {displayName.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className={heroUrl ? 'text-on-media' : 'text-text'}>
              <div className="font-display font-black uppercase text-[20px] leading-none">{displayName}</div>
              {tagline && <div className="text-[11px] mt-1 opacity-80">{tagline}</div>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 px-3 py-2.5 border-t border-(--bd)">
          <div className="relative w-28 h-12 shrink-0 border border-(--bd) grid place-items-center overflow-hidden">
            {logoUrl ? (
              <Image src={logoUrl} alt="" fill sizes="112px" className="object-cover" />
            ) : (
              <div className="text-center px-1">
                <div className="font-display font-black uppercase leading-none text-[13px] truncate">{displayName}</div>
                {tagline && <div className="text-[7px] tracking-[2px] text-muted mt-0.5 truncate">{tagline}</div>}
              </div>
            )}
          </div>
          <span className="text-[11px] text-muted">Celda del carrusel y logo del menú</span>
        </div>
      </div>
    </figure>
  )
}
