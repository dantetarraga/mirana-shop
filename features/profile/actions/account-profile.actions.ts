'use server'

import { db } from '@/shared/lib/db'
import { requireUser } from '@/shared/lib/require-user'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

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

const profileUpdateSchema = z.object({
  phone: z.string().trim().max(30).optional(),
  hasKids: z.boolean().optional(),
  kidsCount: z.number().int().min(0).max(20).nullable().optional(),
})

const addressSchema = z.object({
  label: z.string().trim().min(1).max(40),
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(30),
  address: z.string().trim().min(5).max(250),
  district: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100),
  reference: z.string().trim().max(500).nullable().optional(),
  isDefault: z.boolean().optional(),
})

const addressIdSchema = z.string().min(1).max(191)

// ---------------------------------------------------------------------------
// Perfil
//
// SEGURIDAD: ninguna de estas actions recibe el email como parámetro — se
// deriva SIEMPRE de la sesión (requireUser). Son endpoints HTTP públicos: si
// el email llegara del cliente, cualquiera podría leer/editar datos ajenos.
// ---------------------------------------------------------------------------

export async function getMyProfile(): Promise<ProfileData | null> {
  const session = await requireUser()
  if (session.denied) return null

  const user = await db.user.findUnique({
    where: { email: session.email },
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

export async function updateMyProfile(data: unknown): Promise<{ success: boolean; error?: string }> {
  const session = await requireUser()
  if (session.denied) return { success: false, error: session.denied.error }

  const parsed = profileUpdateSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: 'Datos de perfil inválidos' }
  const input = parsed.data

  try {
    const user = await db.user.findUnique({ where: { email: session.email }, select: { id: true } })
    if (!user) return { success: false, error: 'Usuario no encontrado' }

    await db.profile.upsert({
      where: { userId: user.id },
      update: {
        phone: input.phone ?? undefined,
        hasKids: input.hasKids ?? undefined,
        kidsCount: input.hasKids === false ? null : (input.kidsCount ?? undefined),
      },
      create: {
        userId: user.id,
        phone: input.phone,
        hasKids: input.hasKids ?? false,
        kidsCount: input.hasKids ? (input.kidsCount ?? null) : null,
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

export async function getMyAddresses(): Promise<AddressData[]> {
  const session = await requireUser()
  if (session.denied) return []

  const user = await db.user.findUnique({
    where: { email: session.email },
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
  data: unknown,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const session = await requireUser()
  if (session.denied) return { success: false, error: session.denied.error }

  const parsed = addressSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: 'Datos de dirección inválidos' }
  const input = parsed.data

  try {
    const user = await db.user.findUnique({ where: { email: session.email }, select: { id: true } })
    if (!user) return { success: false, error: 'Usuario no encontrado' }

    const addr = await db.$transaction(async (tx) => {
      const count = await tx.userAddress.count({ where: { userId: user.id } })
      const isDefault = input.isDefault === true || count === 0
      if (isDefault) {
        await tx.userAddress.updateMany({
          where: { userId: user.id },
          data: { isDefault: false },
        })
      }
      return tx.userAddress.create({
        data: {
          userId: user.id,
          label: input.label,
          fullName: input.fullName,
          phone: input.phone,
          address: input.address,
          district: input.district,
          city: input.city,
          reference: input.reference ?? null,
          isDefault,
        },
      })
    })

    revalidatePath('/cuenta/direcciones')
    return { success: true, id: addr.id }
  } catch {
    return { success: false, error: 'Error al guardar la dirección' }
  }
}

export async function updateAddress(
  id: string,
  data: unknown,
): Promise<{ success: boolean; error?: string }> {
  const session = await requireUser()
  if (session.denied) return { success: false, error: session.denied.error }

  if (!addressIdSchema.safeParse(id).success) return { success: false, error: 'ID inválido' }
  const parsed = addressSchema.partial().safeParse(data)
  if (!parsed.success) return { success: false, error: 'Datos de dirección inválidos' }
  const input = parsed.data

  try {
    const user = await db.user.findUnique({ where: { email: session.email }, select: { id: true } })
    if (!user) return { success: false, error: 'Usuario no encontrado' }

    // Verificar que la dirección pertenece al usuario
    const existing = await db.userAddress.findFirst({
      where: { id, userId: user.id },
    })
    if (!existing) return { success: false, error: 'Dirección no encontrada' }

    await db.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.userAddress.updateMany({
          where: { userId: user.id, id: { not: id } },
          data: { isDefault: false },
        })
      }
      await tx.userAddress.update({
        where: { id },
        data: {
          label: input.label ?? undefined,
          fullName: input.fullName ?? undefined,
          phone: input.phone ?? undefined,
          address: input.address ?? undefined,
          district: input.district ?? undefined,
          city: input.city ?? undefined,
          reference: input.reference ?? undefined,
          isDefault: input.isDefault ?? undefined,
        },
      })
    })

    revalidatePath('/cuenta/direcciones')
    return { success: true }
  } catch {
    return { success: false, error: 'Error al actualizar la dirección' }
  }
}

export async function deleteAddress(id: string): Promise<{ success: boolean; error?: string }> {
  const session = await requireUser()
  if (session.denied) return { success: false, error: session.denied.error }
  if (!addressIdSchema.safeParse(id).success) return { success: false, error: 'ID inválido' }

  try {
    const user = await db.user.findUnique({ where: { email: session.email }, select: { id: true } })
    if (!user) return { success: false, error: 'Usuario no encontrado' }

    const existing = await db.userAddress.findFirst({
      where: { id, userId: user.id },
    })
    if (!existing) return { success: false, error: 'Dirección no encontrada' }

    await db.$transaction(async (tx) => {
      await tx.userAddress.delete({ where: { id } })
      if (existing.isDefault) {
        const next = await tx.userAddress.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          select: { id: true },
        })
        if (next) await tx.userAddress.update({ where: { id: next.id }, data: { isDefault: true } })
      }
    })

    revalidatePath('/cuenta/direcciones')
    return { success: true }
  } catch {
    return { success: false, error: 'Error al eliminar la dirección' }
  }
}

export async function setDefaultAddress(id: string): Promise<{ success: boolean; error?: string }> {
  const session = await requireUser()
  if (session.denied) return { success: false, error: session.denied.error }
  if (!addressIdSchema.safeParse(id).success) return { success: false, error: 'ID inválido' }

  try {
    const user = await db.user.findUnique({ where: { email: session.email }, select: { id: true } })
    if (!user) return { success: false, error: 'Usuario no encontrado' }

    // Verificar que la dirección pertenece al usuario antes de marcarla default
    const existing = await db.userAddress.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    })
    if (!existing) return { success: false, error: 'Dirección no encontrada' }

    await db.$transaction(async (tx) => {
      await tx.userAddress.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      })
      await tx.userAddress.update({
        where: { id },
        data: { isDefault: true },
      })
    })

    revalidatePath('/cuenta/direcciones')
    return { success: true }
  } catch {
    return { success: false, error: 'Error al establecer dirección predeterminada' }
  }
}
