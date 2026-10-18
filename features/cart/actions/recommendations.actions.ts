'use server'

import { productCartKind } from '@/features/cart/lib/cart-kind'
import { toProductCards } from '@/features/products/lib/product-card'
import { getCatalogProducts } from '@/features/products/queries/product.queries'
import type { CatalogProduct } from '@/features/products/types/catalog.types'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// "También te puede gustar" del drawer del carrito.
//
// Lee solo listados públicos YA cacheados entre requests (getCatalogProducts,
// tags 'products'/'catalog'): abrir el drawer no cuesta consultas nuevas a la
// BD salvo la primera vez por categoría/marca. La exclusión de lo que ya está
// en el carrito se hace después, en memoria, para no partir la caché por
// carrito.
// ---------------------------------------------------------------------------

const MAX_RECOMMENDATIONS = 6
/** Margen por fuente: lo excluido (carrito, otro tipo) se descuenta de acá. */
const TAKE_PER_SOURCE = 12

const slugSchema = z.string().min(1).max(191)
const inputSchema = z.object({
  productId: z.string().min(1).max(191),
  categorySlug: slugSchema,
  brandSlug: slugSchema,
  /** Ids ya en el carrito. */
  excludeIds: z.array(z.string().min(1).max(191)).max(100),
  /** Tipo del carrito: solo se recomienda lo que se puede combinar con él. */
  kind: z.enum(['PREORDER', 'STANDARD']),
})

export type CartRecommendationsInput = z.input<typeof inputSchema>

/**
 * Hasta 6 productos relacionados con el último agregado: misma categoría,
 * después misma marca y, para completar, destacados. Excluye lo que ya está en
 * el carrito, lo agotado y lo que chocaría con el tipo del carrito (preventa ↔
 * entrega inmediata): recomendar algo que abre el modal de conflicto sería
 * proponer vaciar el carrito.
 */
export async function getCartRecommendationsAction(
  input: CartRecommendationsInput,
): Promise<CatalogProduct[]> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return []
  const { productId, categorySlug, brandSlug, excludeIds, kind } = parsed.data

  // `hideOutOfStock` siempre: no tiene sentido recomendar algo que no se puede
  // agregar. Sin `status` el listado ya es el público (sin borradores/archivados).
  const [byCategory, byBrand, featured] = await Promise.all([
    getCatalogProducts({ categorySlug, hideOutOfStock: true, take: TAKE_PER_SOURCE }),
    getCatalogProducts({ brandSlug, hideOutOfStock: true, take: TAKE_PER_SOURCE }),
    getCatalogProducts({ featured: true, hideOutOfStock: true, take: TAKE_PER_SOURCE }),
  ])

  const excluded = new Set([productId, ...excludeIds])
  const seen = new Set<string>()
  const picked = [...byCategory, ...byBrand, ...featured].filter((p) => {
    if (excluded.has(p.id) || seen.has(p.id)) return false
    if (p.status === 'SOLD_OUT' || productCartKind(p) !== kind) return false
    seen.add(p.id)
    return true
  })

  return toProductCards(picked.slice(0, MAX_RECOMMENDATIONS))
}
