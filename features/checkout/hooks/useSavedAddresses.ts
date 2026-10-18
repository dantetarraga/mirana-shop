'use client'

import type { CheckoutInput } from '@/features/checkout/schemas/checkout.schema'
import {
  createAddress,
  getMyAddresses,
  type AddressData,
} from '@/features/profile/actions/account-profile.actions'
import type { AddressFormValues } from '@/features/profile/components/AddressFormPanel'
import { useState } from 'react'
import type { UseFormSetValue } from 'react-hook-form'
import { toast } from 'sonner'

/** Dirección que el checkout preselecciona: la predeterminada o la primera. */
export function defaultAddress(addresses: AddressData[]): AddressData | null {
  return addresses.find((a) => a.isDefault) ?? addresses[0] ?? null
}

/**
 * Direcciones guardadas del cliente dentro del checkout: elegir una rellena el
 * formulario, "manual" lo limpia y "agregar" la guarda en la cuenta y la aplica.
 * Las direcciones iniciales llegan del servidor (checkout/page.tsx).
 */
export function useSavedAddresses({
  initialAddresses,
  setValue,
  fallbackName,
  canSave,
}: {
  initialAddresses: AddressData[]
  setValue: UseFormSetValue<CheckoutInput>
  /** Nombre con el que se reinicia el formulario al pasar a dirección manual. */
  fallbackName: string
  /** Hay sesión: se puede guardar una dirección nueva en la cuenta. */
  canSave: boolean
}) {
  const [savedAddresses, setSavedAddresses] = useState<AddressData[]>(initialAddresses)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    defaultAddress(initialAddresses)?.id ?? null,
  )
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)

  const applyAddress = (addr: AddressData) => {
    setSelectedAddressId(addr.id)
    setValue('fullName', addr.fullName)
    setValue('phone', addr.phone)
    setValue('address', addr.address)
    setValue('district', addr.district)
    setValue('city', addr.city)
    setValue('reference', addr.reference ?? '')
  }

  const clearSavedAddress = () => {
    setSelectedAddressId(null)
    setValue('fullName', fallbackName)
    setValue('phone', '')
    setValue('address', '')
    setValue('district', '')
    setValue('city', 'Lima')
    setValue('reference', '')
  }

  const saveNewAddress = async (data: AddressFormValues) => {
    if (!canSave) return
    const result = await createAddress(data)
    if (result.success && result.id) {
      toast.success('Dirección guardada en tu cuenta')
      const updated = await getMyAddresses()
      setSavedAddresses(updated)
      const created = updated.find((a) => a.id === result.id)
      if (created) applyAddress(created)
      setShowNewAddressForm(false)
    } else {
      toast.error(result.error ?? 'Error al guardar la dirección')
    }
  }

  return {
    savedAddresses,
    selectedAddressId,
    showNewAddressForm,
    setShowNewAddressForm,
    applyAddress,
    clearSavedAddress,
    saveNewAddress,
  }
}
