import type { ComplaintGoodType, ComplaintStatus, ComplaintType } from '@/generated/prisma/client'
import type { Decimal } from '@/generated/prisma/internal/prismaNamespace'

export type ComplaintRow = {
  id: string
  code: string
  year: number
  seq: number
  fullName: string
  docType: string
  docNumber: string
  address: string
  email: string
  phone: string
  isMinor: boolean
  guardianName: string | null
  guardianDocType: string | null
  guardianDocNumber: string | null
  goodType: ComplaintGoodType
  orderCode: string | null
  productDescription: string
  claimedAmount: Decimal | null
  type: ComplaintType
  detail: string
  request: string
  truthDeclarationAccepted: boolean
  privacyAccepted: boolean
  status: ComplaintStatus
  response: string | null
  providerActions: string | null
  respondedAt: Date | null
  dueAt: Date
  consumerEmailSentAt: Date | null
  responseEmailSentAt: Date | null
  createdAt: Date
}

export type ComplaintFilters = {
  status?: ComplaintStatus
  search?: string
  /** Solo pendientes con el plazo legal ya vencido */
  overdue?: boolean
  take?: number
  skip?: number
}
