'use client'

import { saveDeliveryMethod } from '@/features/delivery/actions/delivery.actions'
import { deliveryMethodSchema, type DeliveryMethodFormValues } from '@/features/delivery/schemas/delivery.schema'
import { DELIVERY_KIND_LABELS, type DeliveryMethodOption } from '@/features/delivery/types'
import { AdminDrawer } from '@/shared/components/admin/AdminDrawer'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Select } from '@/shared/components/ui/Select'
import { useFormEntity, useServerAction } from '@/shared/hooks/admin'
import { cls } from '@/shared/lib/admin/admin-classes'
import { zodResolver } from '@hookform/resolvers/zod'
import { MapPin, Plus, Trash2 } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'

const EMPTY_FORM: DeliveryMethodFormValues = {
  name: '',
  description: '',
  kind: 'SHIPPING',
  cost: 0,
  requiresAddress: true,
  requiresLocation: false,
  active: true,
  locations: [],
}

interface Props {
  method: DeliveryMethodOption | null
  isNew: boolean
  onClose: () => void
}

export function DeliveryMethodDrawer({ method, isNew, onClose }: Props) {
  const { isPending, run } = useServerAction()

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<DeliveryMethodFormValues>({
    resolver: zodResolver(deliveryMethodSchema),
    defaultValues: EMPTY_FORM,
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'locations' })

  useFormEntity({
    entity: method,
    reset,
    defaultValues: EMPTY_FORM,
    mapToForm: (m) => ({
      name: m.name,
      description: m.description ?? '',
      kind: m.kind,
      cost: m.cost,
      requiresAddress: m.requiresAddress,
      requiresLocation: m.requiresLocation,
      active: m.active,
      locations: m.locations.map((loc) => ({
        label: loc.label,
        address: loc.address,
        mapUrl: loc.mapUrl ?? '',
      })),
    }),
  })

  const onSubmit = (data: DeliveryMethodFormValues) => {
    run(() => saveDeliveryMethod(method?.id ?? null, data), {
      successMsg: isNew ? 'Forma de entrega creada' : 'Forma de entrega actualizada',
      onSuccess: () => onClose(),
      refresh: true,
    })
  }

  return (
    <AdminDrawer
      title={isNew ? 'Nueva forma de entrega' : (method?.name ?? 'Forma de entrega')}
      sub={isNew ? 'Crear forma de entrega' : 'Editar forma de entrega'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4.5">
        <FormField label="Nombre" error={errors.name?.message}>
          <input
            {...register('name')}
            className={cls.input}
            placeholder="Retira Gratis / Envío Local Lima y Arequipa"
          />
        </FormField>

        <FormField label="Descripción para el cliente" error={errors.description?.message}>
          <textarea
            {...register('description')}
            rows={3}
            className={`${cls.input} resize-y`}
            placeholder="EXCLUSIVO para Lima Metropolitana, Callao y Arequipa Metropolitana — 01-02 días hábiles"
          />
        </FormField>

        <FormField label="Tipo" error={errors.kind?.message}>
          <Select {...register('kind')}>
            {Object.entries(DELIVERY_KIND_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Costo (S/) — 0 se muestra como «Gratis»" error={errors.cost?.message}>
          <input
            {...register('cost', { valueAsNumber: true })}
            type="number"
            min={0}
            step="0.01"
            className={cls.input}
            placeholder="17.00"
            inputMode="decimal"
          />
        </FormField>

        <div className="flex flex-col gap-3 border border-(--bd) p-3.5">
          <label className="flex items-start gap-2.5 cursor-pointer text-[13px] select-none">
            <input
              type="checkbox"
              {...register('requiresAddress')}
              className="mt-0.5 accent-(--gold)"
            />
            <span>
              <span className="block font-semibold">Pedir dirección de entrega</span>
              <span className="block text-[12px] text-muted mt-0.5">
                Desactívalo en retiro en tienda y en preventa: ahí el checkout solo pide los datos
                de contacto.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer text-[13px] select-none">
            <input
              type="checkbox"
              {...register('requiresLocation')}
              className="mt-0.5 accent-(--gold)"
            />
            <span>
              <span className="block font-semibold">El cliente elige la sede</span>
              <span className="block text-[12px] text-muted mt-0.5">
                Obliga a seleccionar una de las tiendas de abajo antes de confirmar el pedido.
              </span>
            </span>
          </label>
        </div>

        {/* ── Sedes ────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[2px] uppercase text-muted">
              <MapPin size={13} className="text-accent-ink" />
              Sedes / puntos de entrega
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ label: '', address: '', mapUrl: '' })}
            >
              <Plus size={13} className="mr-1.5" /> Agregar sede
            </Button>
          </div>

          {typeof errors.locations?.message === 'string' && (
            <p className="text-[11px] text-[#ff6644]">{errors.locations.message}</p>
          )}

          {fields.length === 0 ? (
            <p className="text-[12px] text-muted border border-dashed border-(--bd) px-3 py-4 text-center">
              Sin sedes. Agrégalas para que el checkout muestre la dirección y el botón «Ver en el
              mapa».
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {fields.map((field, i) => (
                <li key={field.id} className="border border-(--bd) p-3.5 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className={cls.label}>Sede {i + 1}</span>
                    <Button
                      type="button"
                      variant="icon"
                      size="sm"
                      destructive
                      title="Quitar sede"
                      onClick={() => remove(i)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>

                  <FormField label="Etiqueta" error={errors.locations?.[i]?.label?.message}>
                    <input
                      {...register(`locations.${i}.label`)}
                      className={cls.input}
                      placeholder="LIMA"
                    />
                  </FormField>

                  <FormField label="Dirección" error={errors.locations?.[i]?.address?.message}>
                    <input
                      {...register(`locations.${i}.address`)}
                      className={cls.input}
                      placeholder="Av. José Pardo 1167 Int. 206 Miraflores"
                    />
                  </FormField>

                  <FormField
                    label="Enlace de Google Maps (opcional)"
                    error={errors.locations?.[i]?.mapUrl?.message}
                  >
                    <input
                      {...register(`locations.${i}.mapUrl`)}
                      className={cls.input}
                      placeholder="https://maps.app.goo.gl/..."
                    />
                  </FormField>
                  <p className="text-[12px] text-muted -mt-2">
                    Si lo dejas vacío, el botón del checkout busca la dirección en Google Maps.
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer text-[13px] select-none">
          <input type="checkbox" {...register('active')} className="accent-(--gold)" />
          Visible en el checkout
        </label>

        <div className="flex gap-2.5 pt-1">
          <Button type="submit" variant="accent" size="md" full disabled={isPending}>
            {isPending ? 'Guardando...' : isNew ? 'Crear forma de entrega' : 'Guardar cambios'}
          </Button>
          <Button type="button" variant="outline" size="md" full onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </AdminDrawer>
  )
}
