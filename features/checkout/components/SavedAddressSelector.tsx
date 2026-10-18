'use client'

import type { AddressData } from '@/features/profile/actions/account-profile.actions'
import { cn } from '@/shared/lib/utils'
import { Check, MapPin, Plus } from 'lucide-react'
import { sectionCard, sectionTitle } from './ui'

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
    <section className={sectionCard} aria-labelledby="saved-addresses-title">
      <div className="flex items-center justify-between gap-3 mb-5">
        <h2 id="saved-addresses-title" className={sectionTitle}>
          Direcciones guardadas
        </h2>
        {onAddNew && (
          <button
            type="button"
            onClick={onAddNew}
            className="flex items-center gap-1.5 min-h-11 -mr-2 px-2 text-[14px] font-semibold text-accent-ink hover:underline underline-offset-4 cursor-pointer"
          >
            <Plus size={15} aria-hidden />
            Agregar dirección
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
              'text-left flex items-start gap-3 border p-3.5 transition-colors duration-150 cursor-pointer',
              selectedId === addr.id
                ? 'border-(--gold) bg-(--sub)'
                : 'border-(--bd) hover:border-(--bdh)',
            )}
            aria-pressed={selectedId === addr.id}
          >
            <div
              className={cn(
                'mt-0.5 w-4 h-4 shrink-0 border flex items-center justify-center transition-colors duration-150',
                selectedId === addr.id ? 'bg-(--gold) border-(--gold)' : 'bg-surf border-(--bd)',
              )}
            >
              {selectedId === addr.id && <Check size={11} className="text-on-accent" aria-hidden />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <MapPin size={13} className="text-accent-ink shrink-0" aria-hidden />
                <span className="text-[13px] font-semibold text-accent-ink">{addr.label}</span>
                {addr.isDefault && (
                  <span className="text-[12px] border border-(--bd) text-muted px-1.5">
                    Predeterminada
                  </span>
                )}
              </div>
              <p className="text-[14px] font-semibold truncate">{addr.fullName}</p>
              <p className="text-[13px] text-muted truncate">
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
            'text-left flex items-start gap-3 border p-3.5 transition-colors duration-150 cursor-pointer',
            selectedId === null
              ? 'border-(--gold) bg-(--sub)'
              : 'border-(--bd) hover:border-(--bdh)',
          )}
          aria-pressed={selectedId === null}
        >
          <div
            className={cn(
              'mt-0.5 w-4 h-4 shrink-0 border flex items-center justify-center transition-colors duration-150',
              selectedId === null ? 'bg-(--gold) border-(--gold)' : 'bg-surf border-(--bd)',
            )}
          >
            {selectedId === null && <Check size={11} className="text-on-accent" aria-hidden />}
          </div>
          <div>
            <p className="text-[14px] font-semibold">Usar otra dirección</p>
            <p className="text-[13px] text-muted">La escribes en el formulario de abajo.</p>
          </div>
        </button>
      </div>
    </section>
  )
}
