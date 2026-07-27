import type { PromotionType } from '@/generated/prisma/client'

export type PromotionRow = {
  id: string
  name: string
  description: string | null
  type: PromotionType
  active: boolean
  minAmount: number | null
  discountAmount: number | null
  discountPercent: number | null
  /** Solo se aplica si el cliente escribe uno de sus cupones en el checkout */
  requiresCoupon: boolean
  /** Cuántos cupones apuntan a esta promoción */
  couponCount: number
  startsAt: Date | null
  endsAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type CreatePromotionInput = {
  name: string
  description?: string
  type: PromotionType
  active?: boolean
  minAmount?: number
  discountAmount?: number
  discountPercent?: number
  requiresCoupon?: boolean
  startsAt?: Date
  endsAt?: Date
}

export type UpdatePromotionInput = Partial<CreatePromotionInput> & { id: string }
