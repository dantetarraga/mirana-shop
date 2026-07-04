'use client'

import type { AddressData } from '@/features/profile/actions/account-profile.actions'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/utils'
import { Check, Home, Loader2, MapPin, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AddressFormValues = Omit<AddressData, 'id'>

export const LABELS = ['Casa', 'Trabajo', 'Otro']

export const LABEL_ICON: Record<string, React.ReactNode> = {
  Casa: <Home size={13} />,
  Trabajo: <MapPin size={13} />,
  Otro: <MapPin size={13} />,
}

const emptyForm: AddressFormValues = {
  label: 'Casa',
  fullName: '',
  phone: '',
  address: '',
  district: '',
  city: 'Lima',
  reference: '',
  isDefault: false,
}

const inputCls =
  'w-full bg-surf border border-(--bd) text-text font-sans text-[14px] px-[13px] py-[10px] outline-none focus:border-(--gold)/50 transition-colors duration-150 placeholder:text-muted/50'

// ---------------------------------------------------------------------------
// AddressFormPanel
// ---------------------------------------------------------------------------

export function AddressFormPanel({
  initial,
  onSave,
  onCancel,
  title,
}: {
  initial?: AddressFormValues
  onSave: (data: AddressFormValues) => Promise<void>
  onCancel: () => void
  title?: string
}) {
  const [form, setForm] = useState<AddressFormValues>(initial ?? emptyForm)
  const [saving, setSaving] = useState(false)

  const set = (k: keyof AddressFormValues, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (
      !form.fullName.trim() ||
      !form.phone.trim() ||
      !form.address.trim() ||
      !form.district.trim()
    ) {
      toast.error('Completa los campos obligatorios')
      return
    }
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div className="bg-card border border-(--bd) p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] tracking-[3px] uppercase text-(--gold)">
          {title ?? (initial ? 'Editar dirección' : 'Nueva dirección')}
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="text-muted hover:text-text transition-colors duration-150"
        >
          <X size={16} />
        </button>
      </div>

      {/* Etiqueta */}
      <div>
        <label className="label-xs">Etiqueta</label>
        <div className="flex gap-2 mt-1.5">
          {LABELS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => set('label', l)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold border transition-colors duration-150',
                form.label === l
                  ? 'bg-(--gold) text-black border-(--gold)'
                  : 'bg-surf border-(--bd) text-muted hover:border-(--gold)/40',
              )}
            >
              {LABEL_ICON[l]}
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Nombre completo */}
      <div>
        <label className="label-xs">Nombre completo *</label>
        <input
          value={form.fullName}
          onChange={(e) => set('fullName', e.target.value)}
          placeholder="Nombre de quien recibe"
          className={inputCls}
        />
      </div>

      {/* Teléfono */}
      <div>
        <label className="label-xs">Teléfono *</label>
        <input
          value={form.phone}
          onChange={(e) => set('phone', e.target.value)}
          placeholder="+51 999 999 999"
          type="tel"
          className={inputCls}
        />
      </div>

      {/* Dirección */}
      <div>
        <label className="label-xs">Dirección *</label>
        <input
          value={form.address}
          onChange={(e) => set('address', e.target.value)}
          placeholder="Av. / Jr. / Calle, número, piso, dpto."
          className={inputCls}
        />
      </div>

      {/* Distrito / Ciudad */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label-xs">Distrito *</label>
          <input
            value={form.district}
            onChange={(e) => set('district', e.target.value)}
            placeholder="Ej: Miraflores"
            className={inputCls}
          />
        </div>
        <div>
          <label className="label-xs">Ciudad</label>
          <input
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
            placeholder="Lima"
            className={inputCls}
          />
        </div>
      </div>

      {/* Referencia */}
      <div>
        <label className="label-xs">Referencia</label>
        <input
          value={form.reference ?? ''}
          onChange={(e) => set('reference', e.target.value)}
          placeholder="Frente al parque, casa azul…"
          className={inputCls}
        />
      </div>

      {/* Default */}
      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <div
          onClick={() => set('isDefault', !form.isDefault)}
          className={cn(
            'w-5 h-5 border flex items-center justify-center transition-colors duration-150',
            form.isDefault ? 'bg-(--gold) border-(--gold)' : 'bg-surf border-(--bd)',
          )}
        >
          {form.isDefault && <Check size={12} className="text-black" />}
        </div>
        <span className="text-[13px] text-text">Usar como dirección predeterminada</span>
      </label>

      <div className="flex gap-3 pt-1">
        <Button
          variant="accent"
          size="md"
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1"
        >
          {saving ? (
            <Loader2 size={14} className="mr-2 animate-spin" />
          ) : (
            <Check size={14} className="mr-2" />
          )}
          Guardar
        </Button>
        <Button variant="outline" size="md" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
      </div>
    </div>
  )
}
