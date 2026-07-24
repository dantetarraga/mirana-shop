import type { ProductStatus } from '@/generated/prisma/client'

// ---------------------------------------------------------------------------
// Tope de compra por stock.
//
// Regla única para cliente y servidor: nunca se puede tener en el carrito más
// unidades de las disponibles. La preventa (PREORDER) es la excepción — se
// reserva sin descontar stock, así que no tiene tope.
//
// Los mensajes nunca revelan cuántas unidades quedan: eso es información de
// negocio que no se muestra al cliente.
// ---------------------------------------------------------------------------

export interface StockInfo {
  status: ProductStatus
  stock: number
}

/** Unidades máximas que el cliente puede llevar. `null` = sin tope (preventa). */
export function maxPurchasable({ status, stock }: StockInfo): number | null {
  if (status === 'PREORDER') return null
  if (status === 'SOLD_OUT') return 0
  return Math.max(0, stock)
}

/** Cuántas unidades más se pueden agregar dado lo que ya hay en el carrito. */
export function remainingStock(product: StockInfo, inCart: number): number | null {
  const max = maxPurchasable(product)
  return max === null ? null : Math.max(0, max - inCart)
}

/** Ajusta una cantidad al rango permitido [0, máximo]. */
export function clampToStock(product: StockInfo, qty: number): number {
  const max = maxPurchasable(product)
  const floored = Math.max(0, Math.floor(qty))
  return max === null ? floored : Math.min(floored, max)
}

/** Aviso de tope alcanzado — sin decir cuántas unidades hay. */
export function stockLimitMessage(name: string): string {
  return `Alcanzaste la cantidad máxima disponible de "${name}"`
}
