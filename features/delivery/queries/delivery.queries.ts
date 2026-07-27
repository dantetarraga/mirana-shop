import 'server-only'
import type { DeliveryMethodOption } from '@/features/delivery/types'
import { db } from '@/shared/lib/db'

// ---------------------------------------------------------------------------
// Formas de entrega — administrables en /admin/delivery, leídas por el checkout.
// ---------------------------------------------------------------------------

const SELECT = {
  id: true,
  name: true,
  description: true,
  kind: true,
  cost: true,
  requiresAddress: true,
  requiresLocation: true,
  active: true,
  locations: {
    select: { id: true, label: true, address: true, mapUrl: true },
    orderBy: { position: 'asc' },
  },
} as const

type Row = {
  id: string
  name: string
  description: string | null
  kind: DeliveryMethodOption['kind']
  cost: unknown
  requiresAddress: boolean
  requiresLocation: boolean
  active: boolean
  locations: { id: string; label: string; address: string; mapUrl: string | null }[]
}

function serialize(row: Row): DeliveryMethodOption {
  return { ...row, cost: Number(row.cost) }
}

/** Solo métodos activos — para el checkout */
export async function getActiveDeliveryMethods(): Promise<DeliveryMethodOption[]> {
  const rows = await db.deliveryMethod.findMany({
    where: { active: true },
    select: SELECT,
    orderBy: { position: 'asc' },
  })
  return rows.map(serialize)
}

/** Todos los métodos — para el admin */
export async function getAllDeliveryMethods(): Promise<DeliveryMethodOption[]> {
  const rows = await db.deliveryMethod.findMany({
    select: SELECT,
    orderBy: { position: 'asc' },
  })
  return rows.map(serialize)
}

/**
 * Un método activo con sus sedes, para revalidar el checkout contra la BD.
 * Devuelve null si el método no existe o fue desactivado mientras compraban.
 */
export async function getActiveDeliveryMethodById(
  id: string,
): Promise<DeliveryMethodOption | null> {
  const row = await db.deliveryMethod.findFirst({
    where: { id, active: true },
    select: SELECT,
  })
  return row ? serialize(row) : null
}
