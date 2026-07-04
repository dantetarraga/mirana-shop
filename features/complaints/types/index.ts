import type { ComplaintStatus, ComplaintType } from '@/generated/prisma/client'
import type { Decimal } from '@/generated/prisma/internal/prismaNamespace'

export type ComplaintRow = {
  id: string
  code: string
  fullName: string
  docType: string
  docNumber: string
  address: string
  email: string
  phone: string
  productDescription: string
  claimedAmount: Decimal | null
  type: ComplaintType
  detail: string
  request: string
  status: ComplaintStatus
  response: string | null
  respondedAt: Date | null
  createdAt: Date
}

export type ComplaintFilters = {
  status?: ComplaintStatus
  search?: string
  take?: number
  skip?: number
}
