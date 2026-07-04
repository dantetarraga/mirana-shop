'use client'

import {
  createAddress,
  deleteAddress,
  getMyAddresses,
  setDefaultAddress,
  updateAddress,
  type AddressData,
} from '@/features/profile/actions/account-profile.actions'
import {
  AddressFormPanel,
  type AddressFormValues,
} from '@/features/profile/components/AddressFormPanel'
import { Button } from '@/shared/components/ui/Button'
import type { SessionUser } from '@/shared/hooks/useUser'
import { cn } from '@/shared/lib/utils'
import { Home, MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { use, useState } from 'react'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Address card
// ---------------------------------------------------------------------------
const LABEL_ICON: Record<string, React.ReactNode> = {
  Casa: <Home size={13} />,
  Trabajo: <MapPin size={13} />,
  Otro: <MapPin size={13} />,
}

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
// Contenido
// ---------------------------------------------------------------------------
export function DireccionesContent({
  user,
  addressesPromise,
}: {
  user: SessionUser
  addressesPromise: Promise<AddressData[]>
}) {
  const [addresses, setAddresses] = useState<AddressData[]>(use(addressesPromise))
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const reload = async () => {
    setAddresses(await getMyAddresses(user.email))
  }

  const handleCreate = async (data: AddressFormValues) => {
    const result = await createAddress(user.email, data)
    if (result.success) {
      toast.success('Direccion guardada')
      setShowForm(false)
      await reload()
    } else {
      toast.error(result.error ?? 'Error al guardar')
    }
  }

  const handleUpdate = async (id: string, data: AddressFormValues) => {
    const result = await updateAddress(id, user.email, data)
    if (result.success) {
      toast.success('Direccion actualizada')
      setEditingId(null)
      await reload()
    } else {
      toast.error(result.error ?? 'Error al actualizar')
    }
  }

  const handleDelete = async (id: string) => {
    const result = await deleteAddress(id, user.email)
    if (result.success) {
      toast.success('Direccion eliminada')
      setAddresses((prev) => prev.filter((a) => a.id !== id))
    } else {
      toast.error(result.error ?? 'Error al eliminar')
    }
  }

  const handleSetDefault = async (id: string) => {
    const result = await setDefaultAddress(id, user.email)
    if (result.success) {
      toast.success('Direccion predeterminada actualizada')
      await reload()
    } else {
      toast.error(result.error ?? 'Error')
    }
  }

  return (
    <div className="max-w-200 mx-auto px-4 sm:px-6 pt-[calc(var(--nh)+48px)] pb-16">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-[3px] uppercase text-(--gold) mb-1">Cuenta</p>
          <h1 className="font-display font-black uppercase text-[28px] sm:text-[34px] tracking-tight leading-none">
            Mis Direcciones
          </h1>
        </div>
        {!showForm && editingId === null && (
          <Button
            variant="accent"
            size="md"
            onClick={() => setShowForm(true)}
            className="self-start"
          >
            <Plus size={14} className="mr-2" />
            Nueva direccion
          </Button>
        )}
      </div>

      {/* Formulario nueva direccion */}
      {showForm && (
        <div className="mb-6">
          <AddressFormPanel onSave={handleCreate} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Lista */}
      {addresses.length === 0 ? (
        !showForm && (
          <div className="bg-card border border-(--bd) p-12 flex flex-col items-center gap-4 text-center">
            <MapPin size={32} className="text-muted" />
            <p className="text-[14px] text-muted">Aun no tienes direcciones guardadas.</p>
            <Button variant="accent" size="md" onClick={() => setShowForm(true)}>
              <Plus size={14} className="mr-2" />
              Agregar primera direccion
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
