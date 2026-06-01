'use client'

import {
  createAddress,
  deleteAddress,
  getMyAddresses,
  setDefaultAddress,
  updateAddress,
  type AddressData,
} from '@/features/users/actions/account-profile.actions'
import { Button } from '@/shared/components/ui/Button'
import { useStore } from '@/shared/lib/store-context'
import { cn } from '@/shared/lib/utils'
import { Check, Home, Loader2, MapPin, Pencil, Plus, Star, Trash2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const LABELS = ['Casa', 'Trabajo', 'Otro']

const LABEL_ICON: Record<string, React.ReactNode> = {
  Casa: <Home size={13} />,
  Trabajo: <MapPin size={13} />,
  Otro: <MapPin size={13} />,
}

const inputCls =
  'w-full bg-surf border border-(--bd) text-text font-sans text-[14px] px-[13px] py-[10px] outline-none focus:border-(--gold)/50 transition-colors duration-150 placeholder:text-muted/50'

const selectCls =
  'w-full bg-surf border border-(--bd) text-text font-sans text-[14px] px-[13px] py-[10px] outline-none focus:border-(--gold)/50 transition-colors duration-150'

// ---------------------------------------------------------------------------
// Address form
// ---------------------------------------------------------------------------
type AddressForm = Omit<AddressData, 'id'>

const emptyForm: AddressForm = {
  label: 'Casa',
  fullName: '',
  phone: '',
  address: '',
  district: '',
  city: 'Lima',
  reference: '',
  isDefault: false,
}

function AddressFormPanel({
  initial,
  onSave,
  onCancel,
}: {
  initial?: AddressForm
  onSave: (data: AddressForm) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<AddressForm>(initial ?? emptyForm)
  const [saving, setSaving] = useState(false)

  const set = (k: keyof AddressForm, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))

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
          {initial ? 'Editar dirección' : 'Nueva dirección'}
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
      <div className="grid grid-cols-2 gap-3">
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

// ---------------------------------------------------------------------------
// Address card
// ---------------------------------------------------------------------------
function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  address: AddressData
  onEdit: () => void
  onDelete: () => void
  onSetDefault: () => void
}) {
  return (
    <div
      className={cn(
        'bg-card border p-5 flex flex-col gap-3 transition-colors duration-150',
        address.isDefault ? 'border-(--gold)/40' : 'border-(--bd)',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[1.5px] text-(--gold)">
            {LABEL_ICON[address.label]}
            {address.label}
          </span>
          {address.isDefault && (
            <span className="flex items-center gap-1 text-[10px] font-semibold bg-(--gold)/10 text-(--gold) border border-(--gold)/30 px-2 py-0.5">
              <Star size={9} className="fill-(--gold)" />
              Predeterminada
            </span>
          )}
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 text-muted hover:text-text transition-colors duration-150"
            title="Editar"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 text-muted hover:text-red-500 transition-colors duration-150"
            title="Eliminar"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        <p className="text-[13px] font-semibold">{address.fullName}</p>
        <p className="text-[12px] text-muted">{address.phone}</p>
        <p className="text-[13px] text-text">{address.address}</p>
        <p className="text-[12px] text-muted">
          {address.district}, {address.city}
        </p>
        {address.reference && <p className="text-[12px] text-muted italic">{address.reference}</p>}
      </div>

      {!address.isDefault && (
        <button
          type="button"
          onClick={onSetDefault}
          className="self-start text-[11px] font-semibold text-muted hover:text-(--gold) transition-colors duration-150 underline underline-offset-2"
        >
          Establecer como predeterminada
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------
export default function DireccionesPage() {
  const { user, openAuth } = useStore()
  const router = useRouter()
  const [addresses, setAddresses] = useState<AddressData[] | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadAddresses = async (email: string) => {
    const data = await getMyAddresses(email)
    setAddresses(data)
  }

  useEffect(() => {
    if (user === null) {
      setLoading(false)
      const t = setTimeout(() => openAuth('login'), 300)
      return () => clearTimeout(t)
    }
    loadAddresses(user.email).then(() => setLoading(false))
  }, [user, openAuth])

  if (loading || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <p className="text-muted text-[14px]">Cargando…</p>
      </div>
    )
  }

  const handleCreate = async (data: AddressForm) => {
    const result = await createAddress(user.email, data)
    if (result.success) {
      toast.success('Dirección guardada')
      setShowForm(false)
      await loadAddresses(user.email)
    } else {
      toast.error(result.error ?? 'Error al guardar')
    }
  }

  const handleUpdate = async (id: string, data: AddressForm) => {
    const result = await updateAddress(id, user.email, data)
    if (result.success) {
      toast.success('Dirección actualizada')
      setEditingId(null)
      await loadAddresses(user.email)
    } else {
      toast.error(result.error ?? 'Error al actualizar')
    }
  }

  const handleDelete = async (id: string) => {
    const result = await deleteAddress(id, user.email)
    if (result.success) {
      toast.success('Dirección eliminada')
      setAddresses((prev) => (prev ?? []).filter((a) => a.id !== id))
    } else {
      toast.error(result.error ?? 'Error al eliminar')
    }
  }

  const handleSetDefault = async (id: string) => {
    const result = await setDefaultAddress(id, user.email)
    if (result.success) {
      toast.success('Dirección predeterminada actualizada')
      await loadAddresses(user.email)
    } else {
      toast.error(result.error ?? 'Error')
    }
  }

  return (
    <div className="max-w-200 mx-auto px-4 sm:px-6 pt-[calc(var(--nh)+48px)] pb-16">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-[3px] uppercase text-(--gold) mb-1">Cuenta</p>
          <h1 className="font-display font-black uppercase text-[28px] sm:text-[34px] tracking-tight leading-none">
            Mis Direcciones
          </h1>
        </div>
        {!showForm && editingId === null && (
          <Button variant="accent" size="md" onClick={() => setShowForm(true)}>
            <Plus size={14} className="mr-2" />
            Nueva dirección
          </Button>
        )}
      </div>

      {/* Formulario nuevo */}
      {showForm && (
        <div className="mb-6">
          <AddressFormPanel onSave={handleCreate} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Lista */}
      {addresses === null || addresses.length === 0 ? (
        !showForm && (
          <div className="bg-card border border-(--bd) p-12 flex flex-col items-center gap-4 text-center">
            <MapPin size={32} className="text-muted" />
            <p className="text-[14px] text-muted">Aún no tienes direcciones guardadas.</p>
            <Button variant="accent" size="md" onClick={() => setShowForm(true)}>
              <Plus size={14} className="mr-2" />
              Agregar primera dirección
            </Button>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) =>
            editingId === addr.id ? (
              <div key={addr.id} className="sm:col-span-2">
                <AddressFormPanel
                  initial={{
                    label: addr.label,
                    fullName: addr.fullName,
                    phone: addr.phone,
                    address: addr.address,
                    district: addr.district,
                    city: addr.city,
                    reference: addr.reference ?? '',
                    isDefault: addr.isDefault,
                  }}
                  onSave={(data) => handleUpdate(addr.id, data)}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            ) : (
              <AddressCard
                key={addr.id}
                address={addr}
                onEdit={() => setEditingId(addr.id)}
                onDelete={() => handleDelete(addr.id)}
                onSetDefault={() => handleSetDefault(addr.id)}
              />
            ),
          )}
        </div>
      )}
    </div>
  )
}
