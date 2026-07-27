import type { PromotionType } from '@/generated/prisma/client'

export type CouponRow = {
  id: string
  code: string
  promotionId: string
  /** Nombre de la promoción que desbloquea */
  promotionName: string
  promotionType: PromotionType
  /** La promoción a la que apunta está activa y vigente */
  promotionActive: boolean
  active: boolean
  /** null = canjes ilimitados */
  maxUses: number | null
  usedCount: number
  startsAt: Date | null
  endsAt: Date | null
  createdAt: Date
  updatedAt: Date
}

/** Opción del selector de promoción en el drawer de cupones */
export type PromotionOption = {
  id: string
  name: string
  type: PromotionType
  requiresCoupon: boolean
}

/** Normaliza un código escrito por el usuario: mayúsculas y sin espacios */
export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '')
}
