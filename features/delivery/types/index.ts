import type { DeliveryKind } from '@/generated/prisma/client'

export type { DeliveryKind }

// ---------------------------------------------------------------------------
// Formas de entrega. Este archivo es puro (sin 'server-only'): los tipos viajan
// del servidor al checkout dentro de PricingRules, así que el cliente los usa
// para pintar el selector y calcular el total en vivo.
// ---------------------------------------------------------------------------

export interface DeliveryLocationOption {
  id: string
  /** Etiqueta corta de la sede: "LIMA", "AREQUIPA" */
  label: string
  address: string
  /** Enlace a Google Maps; null = no se muestra el botón "Ver en el mapa" */
  mapUrl: string | null
}

export interface DeliveryMethodOption {
  id: string
  name: string
  description: string | null
  kind: DeliveryKind
  /** Costo en PEN; 0 se muestra como "Gratis" */
  cost: number
  /** Pide dirección de entrega (envío a domicilio) */
  requiresAddress: boolean
  /** Obliga a elegir una de las sedes de `locations` */
  requiresLocation: boolean
  active: boolean
  locations: DeliveryLocationOption[]
}

/** Texto que acompaña a cada tipo en el admin */
export const DELIVERY_KIND_LABELS: Record<DeliveryKind, string> = {
  PICKUP: 'Retiro en tienda',
  PREORDER: 'Preventa',
  SHIPPING: 'Envío a domicilio',
}

/**
 * Formatea la sede elegida tal como se guarda en el pedido:
 * "LIMA — Av. José Pardo 1167 Int. 206 Miraflores"
 */
export function formatDeliveryLocation(loc: {
  label: string
  address: string
}): string {
  return `${loc.label} — ${loc.address}`
}

/**
 * Enlace al mapa de una sede. Si el admin no cargó uno, se arma una búsqueda
 * de Google Maps con la dirección, que es suficiente para ubicarla.
 */
export function deliveryMapUrl(loc: DeliveryLocationOption): string {
  if (loc.mapUrl) return loc.mapUrl
  const query = encodeURIComponent(`${loc.label} ${loc.address}`)
  return `https://www.google.com/maps/search/?api=1&query=${query}`
}
