import 'server-only'
import { deliveryMapUrl, type DeliveryMethodOption } from '@/features/delivery/types'
import { db } from '@/shared/lib/db'
import { cachedQuery, CACHE_TAGS, REVALIDATE_LONG } from '@/shared/lib/data-cache'
import { cache } from 'react'

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
async function getActiveDeliveryMethodsImpl(): Promise<DeliveryMethodOption[]> {
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

/** Deduplicada por request con `cache()`. */
export const getActiveDeliveryMethods = cache(getActiveDeliveryMethodsImpl)

/** Sede pública para el footer ("Nuestras tiendas"). */
export interface PickupStore {
  id: string
  label: string
  address: string
  /** Siempre presente: si el admin no cargó uno, búsqueda de Google Maps. */
  mapUrl: string
}

async function fetchPickupStores(): Promise<PickupStore[]> {
  const rows = await db.deliveryMethod.findMany({
    where: { active: true, kind: 'PICKUP' },
    select: { locations: SELECT.locations },
    orderBy: { position: 'asc' },
  })
  // Una misma sede puede figurar en dos métodos de retiro: se muestra una vez.
  const seen = new Set<string>()
  return rows
    .flatMap((r) => r.locations)
    .filter((loc) => {
      const key = `${loc.label}|${loc.address}`.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map((loc) => ({
      id: loc.id,
      label: loc.label,
      address: loc.address,
      mapUrl: deliveryMapUrl(loc),
    }))
}

/**
 * Sedes de retiro en tienda de los métodos PICKUP activos. Se lee en el footer
 * de cada página pública, así que va a la caché de datos (tag `delivery`, que
 * invalidan las actions de /admin/delivery).
 */
export const getPickupStores = cache(
  cachedQuery(fetchPickupStores, ['pickup-stores'], {
    tags: [CACHE_TAGS.delivery],
    revalidate: REVALIDATE_LONG,
  }),
)
