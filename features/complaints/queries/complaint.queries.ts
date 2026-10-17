import 'server-only'
import type { ComplaintFilters, ComplaintRow } from '@/features/complaints/types'
import type { Prisma } from '@/generated/prisma/client'
import { db } from '@/shared/lib/db'

// Retención: las hojas del Libro de Reclamaciones se conservan al menos 2 años
// (D.S. 011-2011-PCM). Ninguna query/purga de este módulo las borra ni las
// envía a la papelera — ver comentario del modelo Complaint en schema.prisma.

export const COMPLAINT_SELECT = {
  id: true,
  code: true,
  year: true,
  seq: true,
  fullName: true,
  docType: true,
  docNumber: true,
  address: true,
  email: true,
  phone: true,
  isMinor: true,
  guardianName: true,
  guardianDocType: true,
  guardianDocNumber: true,
  goodType: true,
  orderCode: true,
  productDescription: true,
  claimedAmount: true,
  type: true,
  detail: true,
  request: true,
  truthDeclarationAccepted: true,
  privacyAccepted: true,
  status: true,
  response: true,
  providerActions: true,
  respondedAt: true,
  dueAt: true,
  consumerEmailSentAt: true,
  responseEmailSentAt: true,
  createdAt: true,
} as const

function buildWhere(
  filters: Omit<ComplaintFilters, 'take' | 'skip'>,
  now: Date = new Date(),
): Prisma.ComplaintWhereInput {
  const { status, search, overdue } = filters
  return {
    status: overdue ? 'PENDING' : (status ?? undefined),
    dueAt: overdue ? { lt: now } : undefined,
    OR: search
      ? [
          { code: { contains: search } },
          { fullName: { contains: search } },
          { email: { contains: search } },
          { docNumber: { contains: search } },
          { orderCode: { contains: search } },
        ]
      : undefined,
  }
}

export async function getComplaints(filters: ComplaintFilters = {}): Promise<ComplaintRow[]> {
  const { take = 50, skip = 0, ...rest } = filters

  return db.complaint.findMany({
    where: buildWhere(rest),
    select: COMPLAINT_SELECT,
    // Orden numérico del correlativo (no por texto del código)
    orderBy: [{ year: 'desc' }, { seq: 'desc' }],
    take,
    skip,
  }) as Promise<ComplaintRow[]>
}

export async function countComplaints(
  filters: Omit<ComplaintFilters, 'take' | 'skip'> = {},
): Promise<number> {
  return db.complaint.count({ where: buildWhere(filters) })
}

export async function getComplaintStats(): Promise<{
  total: number
  pending: number
  answered: number
  overdue: number
}> {
  const now = new Date()
  const [total, pending, answered, overdue] = await Promise.all([
    db.complaint.count(),
    db.complaint.count({ where: { status: 'PENDING' } }),
    db.complaint.count({ where: { status: 'ANSWERED' } }),
    db.complaint.count({ where: { status: 'PENDING', dueAt: { lt: now } } }),
  ])
  return { total, pending, answered, overdue }
}
