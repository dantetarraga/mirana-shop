'use client'

import type { AddressData } from '@/features/users/actions/account-profile.actions'
import { cn } from '@/shared/lib/utils'
import { Check, MapPin, Plus } from 'lucide-react'

type Props = {
  addresses: AddressData[]
  selectedId: string | null
  onSelect: (addr: AddressData) => void
  onClearManual: () => void
  onAddNew?: () => void
}

export function SavedAddressSelector({
  addresses,
  selectedId,
  onSelect,
  onClearManual,
  onAddNew,
}: Props) {
  return (
    <section className="bg-card border border-(--bd) p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-black uppercase text-[14px] tracking-[2px] text-(--gold)">
          Mis direcciones guardadas
        </h2>
        {onAddNew && (
          <button
            type="button"
            onClick={onAddNew}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-muted hover:text-(--gold) transition-colors duration-150"
          >
            <Plus size={13} />
            Nueva
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2.5">
        {addresses.map((addr) => (
          <button
            key={addr.id}
            type="button"
            onClick={() => onSelect(addr)}
            className={cn(
              'text-left flex items-start gap-3 border p-3.5 transition-colors duration-150',
              selectedId === addr.id
                ? 'border-(--gold)/60 bg-(--gold)/5'
                : 'border-(--bd) hover:border-(--gold)/30',
            )}
          >
            <div
              className={cn(
                'mt-0.5 w-4 h-4 shrink-0 border flex items-center justify-center transition-colors duration-150',
                selectedId === addr.id ? 'bg-(--gold) border-(--gold)' : 'bg-surf border-(--bd)',
              )}
            >
              {selectedId === addr.id && <Check size={10} className="text-black" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <MapPin size={12} className="text-(--gold) shrink-0" />
                <span className="text-[11px] font-semibold uppercase tracking-[1.5px] text-(--gold)">
                  {addr.label}
                </span>
                {addr.isDefault && (
                  <span className="text-[9px] tracking-[1px] uppercase border border-(--gold)/30 text-(--gold)/70 px-1.5 py-0.5">
                    Predeterminada
                  </span>
                )}
              </div>
              <p className="text-[13px] font-semibold truncate">{addr.fullName}</p>
              <p className="text-[12px] text-muted truncate">
                {addr.address}, {addr.district}
              </p>
            </div>
          </button>
        ))}

        {/* Opción manual */}
        <button
          type="button"
          onClick={onClearManual}
          className={cn(
            'text-left flex items-start gap-3 border p-3.5 transition-colors duration-150',
            selectedId === null
              ? 'border-(--gold)/60 bg-(--gold)/5'
              : 'border-(--bd) hover:border-(--gold)/30',
          )}
        >
          <div
            className={cn(
              'mt-0.5 w-4 h-4 shrink-0 border flex items-center justify-center transition-colors duration-150',
              selectedId === null ? 'bg-(--gold) border-(--gold)' : 'bg-surf border-(--bd)',
            )}
          >
            {selectedId === null && <Check size={10} className="text-black" />}
          </div>
          <div>
            <p className="text-[13px] font-semibold">Ingresar nueva dirección</p>
            <p className="text-[12px] text-muted">Completa los campos manualmente</p>
          </div>
        </button>
      </div>
    </section>
  )
}
