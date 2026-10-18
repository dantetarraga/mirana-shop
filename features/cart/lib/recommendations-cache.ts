import type { CartKind } from '@/features/cart/lib/cart-kind'

// ---------------------------------------------------------------------------
// Caché en memoria de las recomendaciones del drawer.
//
// El resultado depende del ancla, del tipo de carrito (`kind`) y de lo que ya
// había en el carrito (`excludeIds`), así que la clave incluye los tres: con
// solo el id del ancla, volver a agregar el mismo producto con otro carrito
// devolvía recomendaciones que ya estaban dentro. Además caduca a los 5 min
// para no arrastrar precios o stock de una visita larga.
// ---------------------------------------------------------------------------

export const RECOMMENDATIONS_TTL_MS = 5 * 60_000

/** Clave estable: el orden de `excludeIds` no importa. */
export function recommendationsCacheKey(
  anchorId: string,
  kind: CartKind,
  excludeIds: readonly string[],
): string {
  const ids = Array.from(new Set(excludeIds)).sort()
  return `${anchorId}|${kind}|${ids.join(',')}`
}

/**
 * Caché de promesas con caducidad. Se guarda la promesa (no el resultado) para
 * que dos montajes seguidos compartan la misma petición.
 */
export function createTtlCache<T>(ttlMs: number, now: () => number = Date.now) {
  const entries = new Map<string, { value: T; expiresAt: number }>()

  return {
    get(key: string): T | undefined {
      const entry = entries.get(key)
      if (!entry) return undefined
      if (entry.expiresAt <= now()) {
        entries.delete(key)
        return undefined
      }
      return entry.value
    },
    set(key: string, value: T) {
      // Se aprovecha cada alta para barrer lo caducado: la caché vive toda la
      // sesión y no debe crecer sin límite.
      const t = now()
      for (const [k, e] of entries) if (e.expiresAt <= t) entries.delete(k)
      entries.set(key, { value, expiresAt: t + ttlMs })
    },
    delete(key: string) {
      entries.delete(key)
    },
  }
}
