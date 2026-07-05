import 'server-only'
import { db } from '@/shared/lib/db'
import type { UserFilters, UserRow, UserSegment } from '@/features/users/types'

// Prisma no soporta filtrar por COUNT de relaciones en where.
// Usamos $queryRaw para obtener los IDs que cumplen la condición
// y luego los pasamos al findMany normal.
async function getUserIdsBySegment(segment: UserSegment): Promise<string[] | null> {
  if (segment === 'todos') return null

  if (segment === 'nuevo') return null // Se maneja con orders: { none: {} } en Prisma

  if (segment === 'vip') {
    const rows = await db.$queryRaw<{ id: string }[]>`
      SELECT id FROM \`User\`
      WHERE deletedAt IS NULL
        AND (SELECT COUNT(*) FROM \`Order\` WHERE userId = \`User\`.id) >= 10
    `
    return rows.map((r) => r.id)
  }

  if (segment === 'activo') {
    const rows = await db.$queryRaw<{ id: string }[]>`
      SELECT id FROM \`User\`
      WHERE deletedAt IS NULL
        AND (SELECT COUNT(*) FROM \`Order\` WHERE userId = \`User\`.id) BETWEEN 1 AND 9
    `
    return rows.map((r) => r.id)
  }

  return null
}

const SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  deletedAt: true,
  _count: { select: { orders: true } },
} as const

export async function getUsers(filters: UserFilters = {}): Promise<UserRow[]> {
  const { search, segment = 'todos', take = 100, skip = 0 } = filters

  const segmentIds = await getUserIdsBySegment(segment)

  return db.user.findMany({
    where: {
      deletedAt: null,
      ...(segment === 'nuevo' ? { orders: { none: {} } } : {}),
      ...(segmentIds !== null ? { id: { in: segmentIds } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : {}),
    },
    select: SELECT,
    orderBy: { createdAt: 'desc' },
    take,
    skip,
  }) as Promise<UserRow[]>
}

export async function countUsers(filters: Omit<UserFilters, 'take' | 'skip'> = {}): Promise<number> {
  const { search, segment = 'todos' } = filters

  const segmentIds = await getUserIdsBySegment(segment)

  return db.user.count({
    where: {
      deletedAt: null,
      ...(segment === 'nuevo' ? { orders: { none: {} } } : {}),
      ...(segmentIds !== null ? { id: { in: segmentIds } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : {}),
    },
  })
}

export async function getUserById(id: string): Promise<UserRow | null> {
  return db.user.findUnique({
    where: { id },
    select: SELECT,
  }) as Promise<UserRow | null>
}
