'use client'

import {
  deleteDeliveryMethod,
  toggleDeliveryMethod,
} from '@/features/delivery/actions/delivery.actions'
import { DeliveryMethodDrawer } from '@/features/delivery/components/DeliveryMethodDrawer'
import { DELIVERY_KIND_LABELS, type DeliveryMethodOption } from '@/features/delivery/types'
import { PanelHeader } from '@/shared/components/admin/PanelHeader'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmModal } from '@/shared/components/ui/ConfirmModal'
import { useEntityCrud } from '@/shared/hooks/admin'
import { cls } from '@/shared/lib/admin/admin-classes'
import { cn, formatCurrency } from '@/shared/lib/utils'
import { Eye, EyeOff, MapPin, Pencil, Plus, Store, Timer, Trash2, Truck } from 'lucide-react'

const KIND_ICON = {
  PICKUP: Store,
  PREORDER: Timer,
  SHIPPING: Truck,
} as const

interface Props {
  methods: DeliveryMethodOption[]
}

// ---------------------------------------------------------------------------
// Formas de entrega del checkout: retiro en tienda, preventa y envío. El admin
// define el costo, el texto y las sedes; el checkout las lee tal cual.
// ---------------------------------------------------------------------------

export function DeliveryMethodsClient({ methods }: Props) {
  const crud = useEntityCrud<DeliveryMethodOption>(
    deleteDeliveryMethod,
    (m) => `"${m.name}" eliminada`,
  )

  const toggle = (m: DeliveryMethodOption) =>
    crud.run(() => toggleDeliveryMethod(m.id, m.active), {
      successMsg: m.active ? `"${m.name}" oculta del checkout` : `"${m.name}" visible en el checkout`,
      refresh: true,
    })

  const activeCount = methods.filter((m) => m.active).length

  return (
    <div className="px-8 pt-7 pb-12">
      <PanelHeader
        label="Configuración"
        title={`${activeCount} forma${activeCount !== 1 ? 's' : ''} de entrega activa${activeCount !== 1 ? 's' : ''}`}
        align="center"
        side={
          <Button variant="accent" size="sm" onClick={crud.openNew}>
            <Plus size={13} className="mr-1.5" /> Nueva forma de entrega
          </Button>
        }
      />

      <div className="max-w-200 flex flex-col gap-4">
        {methods.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted gap-3 border border-dashed border-(--bd)">
            <Truck size={48} strokeWidth={1} aria-hidden />
            <p className="text-[14px]">Todavía no hay formas de entrega.</p>
            <p className="text-[12px] max-w-100 text-center">
              Mientras no crees ninguna, el checkout usa el costo de envío base de la
              configuración de la tienda.
            </p>
            <Button variant="accent" size="sm" onClick={crud.openNew}>
              <Plus size={13} className="mr-1.5" /> Crear la primera
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {methods.map((m) => {
              const Icon = KIND_ICON[m.kind] ?? Truck
              return (
                <li
                  key={m.id}
                  className={cn(
                    'bg-card border border-(--bd) p-5 flex flex-col gap-3',
                    !m.active && 'opacity-55',
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 shrink-0 bg-surf border border-(--bd) flex items-center justify-center">
                      <Icon size={16} className="text-accent-ink" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cls.rowName}>{m.name}</span>
                        <span className="text-[9px] tracking-[1.5px] uppercase border border-(--bd) px-1.5 py-0.5 text-muted">
                          {DELIVERY_KIND_LABELS[m.kind]}
                        </span>
                        {!m.active && (
                          <span className="text-[9px] tracking-[1.5px] uppercase border border-(--bd) px-1.5 py-0.5 text-muted">
                            Oculto
                          </span>
                        )}
                      </div>
                      {m.description && (
                        <p className="text-[12px] text-muted mt-1 leading-snug">{m.description}</p>
                      )}
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="font-display font-extrabold text-[16px] text-accent-ink">
                        {m.cost === 0 ? 'Gratis' : formatCurrency(m.cost)}
                      </div>
                      <div className="text-[10px] tracking-[1px] uppercase text-muted mt-0.5">
                        {m.requiresAddress ? 'Con dirección' : 'Sin dirección'}
                      </div>
                    </div>
                  </div>

                  {m.locations.length > 0 && (
                    <ul className="flex flex-col gap-1.5 border-t border-(--bd) pt-3">
                      {m.locations.map((loc) => (
                        <li key={loc.id} className="flex items-start gap-2 text-[12px]">
                          <MapPin size={13} className="mt-0.5 shrink-0 text-accent-ink" />
                          <span>
                            <span className="font-semibold tracking-[1px]">{loc.label}:</span>{' '}
                            <span className="text-muted">{loc.address}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="flex gap-2 justify-end border-t border-(--bd) pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={crud.isPending}
                      onClick={() => toggle(m)}
                    >
                      {m.active ? (
                        <>
                          <EyeOff size={13} className="mr-1.5" /> Ocultar
                        </>
                      ) : (
                        <>
                          <Eye size={13} className="mr-1.5" /> Mostrar
                        </>
                      )}
                    </Button>
                    <Button variant="icon" size="sm" title="Editar" onClick={() => crud.openEdit(m)}>
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="icon"
                      size="sm"
                      destructive
                      title="Eliminar"
                      disabled={crud.isPending}
                      onClick={() => crud.openDelete(m)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <p className="text-[12px] text-muted">
          El cliente elige una de estas opciones en el checkout y su costo reemplaza al envío base.
          Las promociones de envío gratis y los cupones de envío gratis siguen anulando el costo.
        </p>
      </div>

      <ConfirmModal
        open={!!crud.pendingDelete}
        onClose={crud.closeDelete}
        onConfirm={crud.handleDelete}
        title="¿Eliminar forma de entrega?"
        description={`"${crud.pendingDelete?.name ?? ''}" dejará de aparecer en el checkout. Los pedidos ya emitidos conservan el nombre y la sede con la que se hicieron.`}
        isPending={crud.isPending}
      />

      {crud.drawerOpen && (
        <DeliveryMethodDrawer
          method={crud.editing}
          isNew={crud.isNew}
          onClose={crud.closeDrawer}
        />
      )}
    </div>
  )
}
