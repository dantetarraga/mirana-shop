'use server'

import type { AppliedCoupon } from '@/features/checkout/lib/pricing'
import { findRedeemableCoupon } from '@/features/coupons/queries/coupon.queries'
import type { ActionResult } from '@/shared/types/action-result.types'
import { z } from 'zod'

const codeSchema = z.string().min(1, 'Escribe un código de cupón').max(30, 'Código demasiado largo')

/**
 * Valida un cupón escrito en el checkout y devuelve su beneficio para poder
 * mostrar el total actualizado en vivo.
 *
 * Es solo la vista previa: `placeOrder` vuelve a buscar el cupón en la BD y
 * recalcula el descuento antes de crear el pedido, así que un cliente no puede
 * inventarse un beneficio manipulando el navegador.
 */
export async function applyCoupon(rawCode: unknown): Promise<ActionResult<AppliedCoupon>> {
  const parsed = codeSchema.safeParse(rawCode)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Código inválido', code: 400 }
  }

  const lookup = await findRedeemableCoupon(parsed.data)
  if (!lookup.ok) return { success: false, error: lookup.error, code: 400 }

  return { success: true, data: lookup.coupon.rule }
}
