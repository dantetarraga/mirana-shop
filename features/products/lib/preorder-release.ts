import 'server-only'
import { db } from '@/shared/lib/db'

// ---------------------------------------------------------------------------
// Cierre automático de preventas.
//
// Cuando llega la fecha estimada de entrega, el producto deja de ser preventa y
// pasa a venderse normal. El paso importante es el stock: durante la preventa
// las unidades comprometidas se acumulan en `preorderedStock` sin tocar
// `availableStock` (ver features/inventory/lib/stock.ts), así que al convertirlo
// hay que dejarlo en un estado coherente:
//
//   - PREORDER → AVAILABLE si ya hay unidades disponibles.
//   - PREORDER → SOLD_OUT si todavía no llegó mercadería (availableStock = 0).
//     Marcarlo AVAILABLE con 0 unidades lo dejaría comprable sin serlo:
//     `maxPurchasable` devuelve 0 para SOLD_OUT y el checkout lo rechaza.
//
// `preorderedStock` NO se toca: representa pedidos ya hechos, y se descuenta
// cuando el admin acepta o cancela cada pedido.
// ---------------------------------------------------------------------------

export interface ReleaseResult {
  /** Productos que pasaron a AVAILABLE (ya había stock cargado). */
  available: number
  /** Productos que pasaron a SOLD_OUT (llegó la fecha pero no la mercadería). */
  soldOut: number
}

export async function releaseArrivedPreorders(now = new Date()): Promise<ReleaseResult> {
  const due = await db.product.findMany({
    where: {
      status: 'PREORDER',
      deletedAt: null,
      estimatedArrival: { not: null, lte: now },
    },
    select: { id: true, inventory: { select: { availableStock: true } } },
  })

  if (due.length === 0) return { available: 0, soldOut: 0 }

  const withStock = due.filter((p) => (p.inventory?.availableStock ?? 0) > 0).map((p) => p.id)
  const withoutStock = due.filter((p) => (p.inventory?.availableStock ?? 0) <= 0).map((p) => p.id)

  const [available, soldOut] = await Promise.all([
    withStock.length > 0
      ? db.product.updateMany({ where: { id: { in: withStock } }, data: { status: 'AVAILABLE' } })
      : Promise.resolve({ count: 0 }),
    withoutStock.length > 0
      ? db.product.updateMany({ where: { id: { in: withoutStock } }, data: { status: 'SOLD_OUT' } })
      : Promise.resolve({ count: 0 }),
  ])

  return { available: available.count, soldOut: soldOut.count }
}
