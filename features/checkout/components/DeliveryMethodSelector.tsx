'use client'

import { deliveryMapUrl, type DeliveryMethodOption } from '@/features/delivery/types'
import { formatCurrency } from '@/shared/lib/utils'
import { MapPin, Store, Timer, Truck } from 'lucide-react'

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
  methodError,
  locationError,
}: Props) {
  return (
    <section className="bg-card border border-(--bd) p-6">
      <h2 className="font-display font-black uppercase text-[14px] tracking-[2px] text-accent-ink mb-5">
        Forma de entrega
      </h2>

      <ul className="flex flex-col divide-y divide-(--bd) border border-(--bd)">
        {methods.map((method) => {
          const Icon = KIND_ICON[method.kind] ?? Truck
          const isSelected = method.id === selectedId

          return (
            <li key={method.id}>
              <label className="flex items-start gap-3.5 px-4 py-4 cursor-pointer">
                <input
                  type="radio"
                  name="deliveryMethod"
                  value={method.id}
                  checked={isSelected}
                  onChange={() => onSelect(method)}
                  className="mt-1 accent-(--gold) w-4 h-4 shrink-0"
                />
                <Icon size={17} className="mt-0.5 shrink-0 text-accent-ink" aria-hidden />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-display font-bold text-[14px] uppercase tracking-tight leading-tight">
                      {method.name}
                    </span>
                    <span
                      className={`shrink-0 font-semibold text-[13px] ${
                        method.cost === 0 ? 'text-emerald-400 uppercase tracking-wide' : ''
                      }`}
                    >
                      {method.cost === 0 ? 'Gratis' : formatCurrency(method.cost)}
                    </span>
                  </div>

                  {method.description && (
                    <p className="text-[12px] text-muted mt-1 leading-snug whitespace-pre-line">
                      {method.description}
                    </p>
                  )}

                  {/* Sedes. Si el método obliga a elegir una, se muestran como
                      radios anidados; si no, son solo informativas. */}
                  {method.locations.length > 0 && (
                    <ul className="flex flex-col gap-1.5 mt-2.5">
                      {method.locations.map((loc) => (
                        <li key={loc.id} className="flex items-start gap-2 flex-wrap">
                          {isSelected && method.requiresLocation ? (
                            <label className="flex items-start gap-2 cursor-pointer text-[12px] flex-1 min-w-0">
                              <input
                                type="radio"
                                name="deliveryLocation"
                                value={loc.id}
                                checked={loc.id === selectedLocationId}
                                onChange={() => onSelectLocation(loc.id)}
                                className="mt-0.5 accent-(--gold) w-3.5 h-3.5 shrink-0"
                              />
                              <span>
                                <span className="font-semibold tracking-[0.5px]">{loc.label}:</span>{' '}
                                <span className="text-muted">{loc.address}</span>
                              </span>
                            </label>
                          ) : (
                            <span className="text-[12px] flex-1 min-w-0">
                              <span className="font-semibold tracking-[0.5px]">{loc.label}:</span>{' '}
                              <span className="text-muted">{loc.address}</span>
                            </span>
                          )}

                          <a
                            href={deliveryMapUrl(loc)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="shrink-0 inline-flex items-center gap-1 text-[11px] tracking-[1px] uppercase text-accent-ink no-underline hover:underline"
                          >
                            <MapPin size={12} aria-hidden />
                            Ver en el mapa
                            <span className="sr-only"> — {loc.label}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </label>
            </li>
          )
        })}
      </ul>

      {methodError && <p className="text-red-500 text-[12px] mt-2">{methodError}</p>}
      {locationError && <p className="text-red-500 text-[12px] mt-2">{locationError}</p>}
    </section>
  )
}
