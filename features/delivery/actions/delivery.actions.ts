'use server'

import type { DeliveryKind } from '@/generated/prisma/client'
import { deliveryMethodSchema } from '@/features/delivery/schemas/delivery.schema'
import { db } from '@/shared/lib/db'
import { requireAdmin } from '@/shared/lib/require-admin'
import type { ActionResult } from '@/shared/types/action-result.types'
import { revalidatePath } from 'next/cache'

function invalidateDeliveryCaches() {
  revalidatePath('/checkout')
  revalidatePath('/carrito')
  revalidatePath('/admin/delivery')
}

export async function saveDeliveryMethod(
  id: string | null,
  rawInput: unknown,
): Promise<ActionResult<{ id: string }>> {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = deliveryMethodSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos', code: 400 }
  }

  const d = parsed.data
  const data = {
    name: d.name,
    description: d.description || null,
    kind: d.kind as DeliveryKind,
    cost: d.cost,
    requiresAddress: d.requiresAddress,
    requiresLocation: d.requiresLocation,
    active: d.active,
  }
  const locations = d.locations.map((loc, i) => ({
    label: loc.label,
    address: loc.address,
    mapUrl: loc.mapUrl || null,
    position: i,
  }))

  try {
    if (id) {
      // Las sedes se reemplazan en bloque: son pocas y el drawer siempre manda
      // la lista completa, así que un diff fino no aporta nada.
      const updated = await db.$transaction(async (tx) => {
        const row = await tx.deliveryMethod.update({
          where: { id },
          data,
          select: { id: true },
        })
        await tx.deliveryLocation.deleteMany({ where: { methodId: id } })
        if (locations.length > 0) {
          await tx.deliveryLocation.createMany({
            data: locations.map((loc) => ({ ...loc, methodId: id })),
          })
        }
        return row
      })
      invalidateDeliveryCaches()
      return { success: true, data: { id: updated.id } }
    }

    const position = await db.deliveryMethod.count()
    const created = await db.deliveryMethod.create({
      data: { ...data, position, locations: { create: locations } },
      select: { id: true },
    })
    invalidateDeliveryCaches()
    return { success: true, data: { id: created.id } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al guardar la forma de entrega'
    return { success: false, error: message, code: 500 }
  }
}

export async function toggleDeliveryMethod(id: string, active: boolean): Promise<ActionResult> {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    await db.deliveryMethod.update({ where: { id }, data: { active: !active } })
    invalidateDeliveryCaches()
    return { success: true, data: undefined }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al cambiar el estado'
    return { success: false, error: message, code: 500 }
  }
}

export async function deleteDeliveryMethod(id: string): Promise<ActionResult> {
  const denied = await requireAdmin()
  if (denied) return denied

  if (!id) return { success: false, error: 'ID requerido', code: 400 }

  try {
    // Los pedidos ya emitidos conservan el nombre y la sede como snapshot, así
    // que borrar el método no los deja sin información (la FK queda en null).
    await db.deliveryMethod.delete({ where: { id } })
    invalidateDeliveryCaches()
    return { success: true, data: undefined }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al eliminar la forma de entrega'
    return { success: false, error: message, code: 500 }
  }
}
