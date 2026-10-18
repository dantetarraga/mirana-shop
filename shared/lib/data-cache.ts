import 'server-only'
import { unstable_cache } from 'next/cache'
import { Decimal } from '@/generated/prisma/internal/prismaNamespace'

// ---------------------------------------------------------------------------
// Caché de datos entre requests para las lecturas públicas de la tienda.
//
// Por qué: cada vista consultaba todo a la BD y Hostinger limita a 500
// conexiones nuevas por hora. `unstable_cache` guarda el resultado en la caché
// de datos de Next y lo invalida con los mismos tags que ya disparan las
// actions (`revalidateTag('products' | 'catalog' | …)`). Además, cada entrada
// hereda los tags implícitos de la ruta que la lee, así que un
// `revalidatePath('/')` o `revalidatePath('/', 'layout')` también la caduca.
//
// Ojo con la serialización: la caché guarda JSON, así que las fechas vuelven
// como string y los Decimal de Prisma como string. Cada consulta cacheada pasa
// su `revive` para devolver exactamente el tipo que prometía antes.
//
// NUNCA cachear aquí nada que dependa del usuario (carrito, cuenta, admin) ni
// que lea cookies/headers.
// ---------------------------------------------------------------------------

/** Datos de catálogo poco cambiantes: taxonomía, ajustes, CTA. */
export const REVALIDATE_LONG = 3600
/**
 * Datos con stock o ventanas de tiempo (productos, banners programados). El
 * checkout y los ajustes de inventario no invalidan tags, así que se acota el
 * tiempo que puede quedar desfasado el stock mostrado.
 */
export const REVALIDATE_SHORT = 300

/** Tags de invalidación usados en features/** /actions. */
export const CACHE_TAGS = {
  products: 'products',
  catalog: 'catalog',
  categories: 'categories',
  brands: 'brands',
  collections: 'collections',
  banners: 'banners',
  settings: 'settings',
  homeCta: 'home-cta',
  delivery: 'delivery',
  reviews: 'reviews',
} as const

type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS]

interface CachedQueryOptions<R> {
  tags: CacheTag[]
  revalidate: number
  /** Reconstruye Date/Decimal tras pasar por JSON. */
  revive?: (raw: R) => R
}

/**
 * Envuelve una consulta en `unstable_cache`. El wrapper se construye en la
 * primera llamada (no al importar el módulo) para que los tests que mockean
 * `next/cache` sin `unstable_cache` puedan seguir importando las queries.
 */
export function cachedQuery<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
  keyParts: string[],
  { tags, revalidate, revive }: CachedQueryOptions<R>,
): (...args: A) => Promise<R> {
  let cached: ((...args: A) => Promise<R>) | null = null
  return async (...args: A) => {
    cached ??= unstable_cache(fn, keyParts, { tags, revalidate })
    const result = await cached(...args)
    return revive ? revive(result) : result
  }
}

// ---------------------------------------------------------------------------
// Revividores
// ---------------------------------------------------------------------------

export function reviveDate(value: Date | string): Date
export function reviveDate(value: Date | string | null): Date | null
export function reviveDate(value: Date | string | null): Date | null {
  if (value == null) return null
  return value instanceof Date ? value : new Date(value)
}

export function reviveDecimal(value: Decimal | string | number): Decimal
export function reviveDecimal(value: Decimal | string | number | null): Decimal | null
export function reviveDecimal(value: Decimal | string | number | null): Decimal | null {
  if (value == null) return null
  return value instanceof Decimal ? value : new Decimal(value)
}
