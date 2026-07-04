import 'server-only'
import type { ComplaintFilters, ComplaintRow } from '@/features/complaints/types'
import { db } from '@/shared/lib/db'

export const COMPLAINT_SELECT = {
  id: true,
  code: true,
  fullName: true,
  docType: true,
  docNumber: true,
  address: true,
  email: true,
  phone: true,
  productDescription: true,
  claimedAmount: true,
  type: true,
  detail: true,
  request: true,
  status: true,
  response: true,
  respondedAt: true,
  createdAt: true,
} as const

export async function getComplaints(filters: ComplaintFilters = {}): Promise<ComplaintRow[]> {
  const { status, search, take = 50, skip = 0 } = filters

  return db.complaint.findMany({
    where: {
      status: status ?? undefined,
      OR: search
        ? [
            { code: { contains: search, mode: 'insensitive' } },
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { docNumber: { contains: search, mode: 'insensitive' } },
          ]
        : undefined,
    },
    select: COMPLAINT_SELECT,
    orderBy: { createdAt: 'desc' },
    take,
    skip,
  }) as Promise<ComplaintRow[]>
}

export async function countComplaints(filters: Omit<ComplaintFilters, 'take' | 'skip'> = {}): Promise<number> {
  const { status, search } = filters

  return db.complaint.count({
    where: {
      status: status ?? undefined,
      OR: search
        ? [
            { code: { contains: search, mode: 'insensitive' } },
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { docNumber: { contains: search, mode: 'insensitive' } },
          ]
        : undefined,
    },
  })
}

export async function getComplaintStats(): Promise<{
  total: number
  pending: number
  answered: number
}> {
  const [total, pending, answered] = await Promise.all([
    db.complaint.count(),
    db.complaint.count({ where: { status: 'PENDING' } }),
    db.complaint.count({ where: { status: 'ANSWERED' } }),
  ])
  return { total, pending, answered }
}
