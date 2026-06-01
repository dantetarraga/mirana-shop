'use server'

import { db } from '@/shared/lib/db'
import { revalidatePath } from 'next/cache'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type ProfileData = {
  name: string | null
  email: string
  phone: string | null
  dni: string | null
  hasKids: boolean
  kidsCount: number | null
}

export type AddressData = {
  id: string
  label: string
  fullName: string
  phone: string
  address: string
  district: string
  city: string
  reference: string | null
  isDefault: boolean
}

// ---------------------------------------------------------------------------
// Perfil
// ---------------------------------------------------------------------------

export async function getMyProfile(email: string): Promise<ProfileData | null> {
  const user = await db.user.findUnique({
    where: { email },
    select: {
      name: true,
      email: true,
      profile: { select: { phone: true, dni: true, hasKids: true, kidsCount: true } },
    },
  })
  if (!user) return null
  return {
    name: user.name,
    email: user.email,
    phone: user.profile?.phone ?? null,
    dni: user.profile?.dni ?? null,
    hasKids: user.profile?.hasKids ?? false,
    kidsCount: user.profile?.kidsCount ?? null,
  }
}

export async function updateMyProfile(
  email: string,
  data: { phone?: string; hasKids?: boolean; kidsCount?: number | null },
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await db.user.findUnique({ where: { email }, select: { id: true } })
    if (!user) return { success: false, error: 'Usuario no encontrado' }

    await db.profile.upsert({
      where: { userId: user.id },
      update: {
        phone: data.phone ?? undefined,
        hasKids: data.hasKids ?? undefined,
        kidsCount: data.hasKids === false ? null : (data.kidsCount ?? undefined),
      },
      create: {
        userId: user.id,
        phone: data.phone,
        hasKids: data.hasKids ?? false,
        kidsCount: data.hasKids ? (data.kidsCount ?? null) : null,
      },
    })

    revalidatePath('/cuenta/perfil')
    return { success: true }
  } catch {
    return { success: false, error: 'Error al actualizar el perfil' }
  }
}

// ---------------------------------------------------------------------------
// Direcciones
// ---------------------------------------------------------------------------

export async function getMyAddresses(email: string): Promise<AddressData[]> {
  const user = await db.user.findUnique({
    where: { email },
    select: {
      addresses: {
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          label: true,
          fullName: true,
          phone: true,
          address: true,
          district: true,
          city: true,
          reference: true,
          isDefault: true,
        },
      },
    },
  })
  return (user?.addresses ?? []) as AddressData[]
}

export async function createAddress(
  email: string,
  data: Omit<AddressData, 'id' | 'isDefault'> & { isDefault?: boolean },
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const user = await db.user.findUnique({ where: { email }, select: { id: true } })
    if (!user) return { success: false, error: 'Usuario no encontrado' }

    // Si es la primera o se marca como default, desmarcar las demás
    if (data.isDefault) {
      await db.userAddress.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      })
    }

    const addr = await db.userAddress.create({
      data: {
        userId: user.id,
        label: data.label,
        fullName: data.fullName,
        phone: data.phone,
        address: data.address,
        district: data.district,
        city: data.city,
        reference: data.reference ?? null,
        isDefault: data.isDefault ?? false,
      },
    })

    revalidatePath('/cuenta/direcciones')
    return { success: true, id: addr.id }
  } catch {
    return { success: false, error: 'Error al guardar la dirección' }
  }
}

export async function updateAddress(
  id: string,
  email: string,
  data: Partial<Omit<AddressData, 'id'>>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await db.user.findUnique({ where: { email }, select: { id: true } })
    if (!user) return { success: false, error: 'Usuario no encontrado' }

    // Verificar que la dirección pertenece al usuario
    const existing = await db.userAddress.findFirst({
      where: { id, userId: user.id },
    })
    if (!existing) return { success: false, error: 'Dirección no encontrada' }

    if (data.isDefault) {
      await db.userAddress.updateMany({
        where: { userId: user.id, id: { not: id } },
        data: { isDefault: false },
      })
    }

    await db.userAddress.update({
      where: { id },
      data: {
        label: data.label ?? undefined,
        fullName: data.fullName ?? undefined,
        phone: data.phone ?? undefined,
        address: data.address ?? undefined,
        district: data.district ?? undefined,
        city: data.city ?? undefined,
        reference: data.reference ?? undefined,
        isDefault: data.isDefault ?? undefined,
      },
    })

    revalidatePath('/cuenta/direcciones')
    return { success: true }
  } catch {
    return { success: false, error: 'Error al actualizar la dirección' }
  }
}

export async function deleteAddress(
  id: string,
  email: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await db.user.findUnique({ where: { email }, select: { id: true } })
    if (!user) return { success: false, error: 'Usuario no encontrado' }

    const existing = await db.userAddress.findFirst({
      where: { id, userId: user.id },
    })
    if (!existing) return { success: false, error: 'Dirección no encontrada' }

    await db.userAddress.delete({ where: { id } })

    revalidatePath('/cuenta/direcciones')
    return { success: true }
  } catch {
    return { success: false, error: 'Error al eliminar la dirección' }
  }
}

export async function setDefaultAddress(
  id: string,
  email: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await db.user.findUnique({ where: { email }, select: { id: true } })
    if (!user) return { success: false, error: 'Usuario no encontrado' }

    await db.userAddress.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    })
    await db.userAddress.update({
      where: { id },
      data: { isDefault: true },
    })

    revalidatePath('/cuenta/direcciones')
    return { success: true }
  } catch {
    return { success: false, error: 'Error al establecer dirección predeterminada' }
  }
}
