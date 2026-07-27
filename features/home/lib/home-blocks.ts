/**
 * Claves de los bloques fijos del inicio que el admin puede ocultar.
 * Se guardan en StoreSettings.hiddenHomeBlocks (CSV).
 */
export const HOME_BLOCKS = {
  NEW_ARRIVALS: 'new-arrivals',
  FEATURED_PRODUCTS: 'featured-products',
  PREORDER: 'preorder',
  REVIEWS: 'reviews',
  CTA_BAND: 'cta-band',
} as const

export type HomeBlockKey = (typeof HOME_BLOCKS)[keyof typeof HOME_BLOCKS]

export const HOME_BLOCK_LABELS: Record<HomeBlockKey, { title: string; desc: string }> = {
  'new-arrivals': {
    title: 'Novedades',
    desc: 'Los productos más recientes del catálogo.',
  },
  'featured-products': {
    title: 'Favoritos del momento',
    desc: 'Productos destacados o los más recientes si no hay marcados.',
  },
  preorder: {
    title: 'Preventas',
    desc: 'Productos en preventa disponibles para reserva.',
  },
  reviews: {
    title: 'Reseñas de clientes',
    desc: 'Testimonios de compradores anteriores.',
  },
  'cta-band': {
    title: 'Banda de llamada a la acción',
    desc: 'Franja con texto promocional y botón configurable.',
  },
}

/** Parsea el CSV de la BD a un Set para consultas O(1) */
export function parseHiddenBlocks(csv: string): Set<HomeBlockKey> {
  return new Set(
    csv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean) as HomeBlockKey[],
  )
}

/** Serializa el Set de vuelta a CSV para guardar en la BD */
export function serializeHiddenBlocks(blocks: Set<HomeBlockKey> | HomeBlockKey[]): string {
  return [...blocks].join(',')
}

export function isBlockHidden(csv: string, key: HomeBlockKey): boolean {
  return parseHiddenBlocks(csv).has(key)
}
