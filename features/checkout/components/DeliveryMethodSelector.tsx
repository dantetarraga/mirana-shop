'use client'

import { deliveryMapUrl, type DeliveryMethodOption } from '@/features/delivery/types'
import { formatCurrency } from '@/shared/lib/utils'
import { cn } from '@/shared/lib/utils'
import { MapPin, Store, Timer, Truck } from 'lucide-react'
import { sectionCard, sectionLead, sectionTitle } from './ui'

const KIND_ICON = {
  PICKUP: Store,
  PREORDER: Timer,
  SHIPPING: Truck,
} as const

type Props = {
  methods: DeliveryMethodOption[]
  selectedId: string
  onSelect: (method: DeliveryMethodOption) => void
  /** Sede elegida dentro del método seleccionado */
  selectedLocationId: string
  onSelectLocation: (locationId: string) => void
  /** Aclaración de por qué la lista está recortada (ver `delivery-eligibility.ts`) */
  hint?: string
  methodError?: string
  locationError?: string
}

// ---------------------------------------------------------------------------
// Formas de entrega — la lista sale tal cual del admin (/admin/delivery):
// nombre, descripción, costo y sedes. Cada sede lleva su enlace al mapa.
// ---------------------------------------------------------------------------

export function DeliveryMethodSelector({
  methods,
  selectedId,
  onSelect,
  selectedLocationId,
  onSelectLocation,
  hint,
  methodError,
  locationError,
}: Props) {
  return (
    <section className={sectionCard} aria-labelledby="delivery-method-title">
      <h2 id="delivery-method-title" className={sectionTitle}>
        Forma de entrega
      </h2>
      <p className={sectionLead}>
        {hint ?? 'El costo de entrega se suma al total del resumen.'}
      </p>

      <ul className="flex flex-col gap-2.5 mt-6">
        {methods.map((method) => {
          const Icon = KIND_ICON[method.kind] ?? Truck
          const isSelected = method.id === selectedId

          return (
            <li
              key={method.id}
              className={cn(
                'border transition-colors duration-150',
                isSelected ? 'border-(--gold) bg-(--sub)' : 'border-(--bd) hover:border-(--bdh)',
              )}
            >
              {/* El label cubre solo la cabecera del método: las sedes (con sus
                  propios radios y enlaces) van fuera, porque un label no puede
                  contener otros controles interactivos. */}
              <label className="flex items-start gap-3.5 px-4 py-4 cursor-pointer">
                <input
                  type="radio"
                  name="deliveryMethod"
                  value={method.id}
                  checked={isSelected}
                  onChange={() => onSelect(method)}
                  className="mt-0.5 accent-accent-ink size-5 shrink-0"
                />
                <Icon size={18} className="mt-0.5 shrink-0 text-accent-ink" aria-hidden />

                <span className="flex-1 min-w-0">
                  <span className="flex items-start justify-between gap-3">
                    <span className="text-[15px] leading-5 font-semibold text-text">
                      {method.name}
                    </span>
                    <span
                      className={cn(
                        'shrink-0 font-semibold text-[14px] leading-5 tabular-nums',
                        method.cost === 0 && 'text-success',
                      )}
                    >
                      {method.cost === 0 ? 'Gratis' : formatCurrency(method.cost)}
                    </span>
                  </span>

                  {method.description && (
                    <span className="block text-[13px] text-muted mt-1 leading-snug whitespace-pre-line">
                      {method.description}
                    </span>
                  )}
                </span>
              </label>

              {/* Sedes. Si el método obliga a elegir una, se muestran como
                  radios propios; si no, son solo informativas. La sangría
                  alinea el texto con el nombre del método (radio + icono). */}
              {method.locations.length > 0 && (
                <ul className="flex flex-col gap-1 -mt-2 pb-3 pr-4 pl-[82px]">
                  {method.locations.map((loc) => (
                    <li key={loc.id} className="flex items-start gap-2 flex-wrap">
                      {isSelected && method.requiresLocation ? (
                        <label className="flex items-start gap-2.5 cursor-pointer text-[13px] leading-snug flex-1 min-w-0 py-2">
                          <input
                            type="radio"
                            name="deliveryLocation"
                            value={loc.id}
                            checked={loc.id === selectedLocationId}
                            onChange={() => onSelectLocation(loc.id)}
                            className="mt-px accent-accent-ink size-4.5 shrink-0"
                          />
                          <span>
                            <span className="font-semibold text-text">{loc.label}:</span>{' '}
                            <span className="text-muted">{loc.address}</span>
                          </span>
                        </label>
                      ) : (
                        <span className="text-[13px] leading-snug flex-1 min-w-0 py-2">
                          <span className="font-semibold text-text">{loc.label}:</span>{' '}
                          <span className="text-muted">{loc.address}</span>
                        </span>
                      )}

                      <a
                        href={deliveryMapUrl(loc)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 inline-flex items-center gap-1 min-h-9 text-[13px] font-semibold text-accent-ink no-underline hover:underline underline-offset-4"
                      >
                        <MapPin size={12} aria-hidden />
                        Ver en el mapa
                        <span className="sr-only"> de {loc.label} (se abre en una pestaña nueva)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>

      {methodError && <p role="alert" className="text-danger text-[13px] mt-3">{methodError}</p>}
      {locationError && <p role="alert" className="text-danger text-[13px] mt-3">{locationError}</p>}
    </section>
  )
}
