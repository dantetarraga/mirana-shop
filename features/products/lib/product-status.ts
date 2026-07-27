import type { ProductStatus } from '@/generated/prisma/client'

// ---------------------------------------------------------------------------
// Estados de producto — etiquetas y orden en un solo sitio, igual que
// `order-status.ts`. Lo usan el filtro del listado, la tabla del admin y el
// formulario, así que un estado nuevo se traduce una sola vez.
// ---------------------------------------------------------------------------

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  AVAILABLE: 'Disponible',
  PREORDER: 'Preventa',
  SOLD_OUT: 'Agotado',
  COMING_SOON: 'Próximamente',
  ARCHIVED: 'Archivado',
}

/** Orden en que se ofrecen en los desplegables del admin */
export const PRODUCT_STATUS_VALUES: ProductStatus[] = [
  'AVAILABLE',
  'PREORDER',
  'SOLD_OUT',
  'COMING_SOON',
  'ARCHIVED',
]

export const PRODUCT_STATUS_OPTIONS = PRODUCT_STATUS_VALUES.map((value) => ({
  value,
  label: PRODUCT_STATUS_LABELS[value],
}))

/** Filtra lo que llega por la URL: descarta cualquier estado inventado. */
export function parseProductStatuses(raw: string | undefined): ProductStatus[] {
  if (!raw) return []
  const values = raw.split(',').filter(Boolean)
  return PRODUCT_STATUS_VALUES.filter((s) => values.includes(s))
}
