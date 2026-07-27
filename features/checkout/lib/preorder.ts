// ---------------------------------------------------------------------------
// Preventa parcial — cálculo del adelanto y del saldo.
//
// Puro y sin 'server-only', igual que pricing.ts: el cliente lo usa para mostrar
// montos en vivo y placeOrder lo REUTILIZA en el servidor para recalcularlos.
// Este es el único lugar donde vive la fórmula del adelanto.
// ---------------------------------------------------------------------------

import { effectivePrice } from '@/features/checkout/lib/pricing'
import type { PreorderMode } from '@/generated/prisma/client'

export type { PreorderMode }

/** Adelanto por defecto si no hay ajuste de tienda cargado. Espeja el default del schema. */
export const DEFAULT_DEPOSIT_PERCENT = 50

/** Lo mínimo que hace falta saber de un producto para calcular su adelanto. */
export interface PreorderPricing {
  price: number
  salePrice: number | null
  status: string
  allowPartialPreorder: boolean
  preorderDepositPercent: number | null
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** ¿Este producto se puede reservar pagando solo una parte? */
export function canPartialPreorder(p: {
  status: string
  allowPartialPreorder: boolean
}): boolean {
  return p.status === 'PREORDER' && p.allowPartialPreorder
}

/**
 * Porcentaje de adelanto vigente: el del producto si lo tiene, si no el global
 * de la tienda. Se recorta a 1-100 para que un dato corrupto no genere un
 * adelanto negativo ni mayor al precio.
 */
export function resolveDepositPercent(
  p: { preorderDepositPercent: number | null },
  globalDefault: number = DEFAULT_DEPOSIT_PERCENT,
): number {
  const pct = p.preorderDepositPercent ?? globalDefault
  return Math.min(100, Math.max(1, Math.round(pct)))
}

/**
 * Adelanto por unidad. Se calcula sobre el precio efectivo (la oferta si la hay),
 * no sobre el precio base: con precio 359 y oferta 319, el 15% son S/47.85.
 */
export function depositUnitPrice(p: PreorderPricing, globalDefault?: number): number {
  return round2((effectivePrice(p) * resolveDepositPercent(p, globalDefault)) / 100)
}

/** Saldo por unidad que queda para después. */
export function balanceUnitPrice(p: PreorderPricing, globalDefault?: number): number {
  return round2(effectivePrice(p) - depositUnitPrice(p, globalDefault))
}

/**
 * Modo efectivo de una línea: si el producto ya no admite parcial (se apagó, se
 * volvió AVAILABLE, se archivó), la línea se cobra completa. Se usa tanto en la
 * UI como en placeOrder, para que un payload manipulado no consiga un adelanto.
 */
export function effectiveMode(p: PreorderPricing, requested: PreorderMode): PreorderMode {
  return requested === 'PARTIAL' && canPartialPreorder(p) ? 'PARTIAL' : 'FULL'
}

export interface PreorderLine {
  product: PreorderPricing
  qty: number
  preorderMode: PreorderMode
}

export interface PreorderSplit {
  /** Valor completo del pedido — Σ precio efectivo × cantidad. */
  subtotal: number
  /** Lo que se cobra ahora, antes de envío y descuentos. */
  payableNow: number
  /** Saldo que queda pendiente. 0 si no hay ninguna línea parcial. */
  dueTotal: number
}

/**
 * Reparte un carrito entre "se paga ahora" y "queda pendiente".
 *
 * Sin líneas parciales `payableNow === subtotal` y `dueTotal === 0`, así que el
 * resto del cálculo (computeTotals) se comporta exactamente igual que antes.
 */
export function splitPreorderTotals(lines: PreorderLine[], globalDefault?: number): PreorderSplit {
  let subtotal = 0
  let payableNow = 0

  for (const line of lines) {
    const full = effectivePrice(line.product) * line.qty
    subtotal += full
    payableNow +=
      effectiveMode(line.product, line.preorderMode) === 'PARTIAL'
        ? depositUnitPrice(line.product, globalDefault) * line.qty
        : full
  }

  subtotal = round2(subtotal)
  payableNow = round2(payableNow)

  return { subtotal, payableNow, dueTotal: round2(subtotal - payableNow) }
}
