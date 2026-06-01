import type { PromotionType } from '@/generated/prisma/client'
import { db } from '@/shared/lib/db'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PromotionRow = {
  id: string
  name: string
  description: string | null
  type: PromotionType
  active: boolean
  minAmount: number | null
  discountAmount: number | null
  discountPercent: number | null
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
  startsAt?: Date
  endsAt?: Date
}

export type UpdatePromotionInput = Partial<CreatePromotionInput> & { id: string }

// ---------------------------------------------------------------------------
// Repo
// ---------------------------------------------------------------------------

export const promotionRepo = {
  async findAll(): Promise<PromotionRow[]> {
    const rows = await db.promotion.findMany({
      orderBy: [{ type: 'asc' }, { createdAt: 'desc' }],
    })
    return rows.map(serialize)
  },

  async findActive(): Promise<PromotionRow[]> {
    const now = new Date()
    const rows = await db.promotion.findMany({
      where: {
        active: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      orderBy: { type: 'asc' },
    })
    return rows.map(serialize)
  },

  async findById(id: string): Promise<PromotionRow | null> {
    const row = await db.promotion.findUnique({ where: { id } })
    return row ? serialize(row) : null
  },

  async create(input: CreatePromotionInput): Promise<PromotionRow> {
    const row = await db.promotion.create({
      data: {
        name: input.name,
        description: input.description,
        type: input.type,
        active: input.active ?? true,
        minAmount: input.minAmount,
        discountAmount: input.discountAmount,
        discountPercent: input.discountPercent,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
      },
    })
    return serialize(row)
  },

  async update({ id, ...input }: UpdatePromotionInput): Promise<PromotionRow> {
    const row = await db.promotion.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.type !== undefined && { type: input.type }),
        ...(input.active !== undefined && { active: input.active }),
        ...(input.minAmount !== undefined && { minAmount: input.minAmount }),
        ...(input.discountAmount !== undefined && { discountAmount: input.discountAmount }),
        ...(input.discountPercent !== undefined && { discountPercent: input.discountPercent }),
        ...(input.startsAt !== undefined && { startsAt: input.startsAt }),
        ...(input.endsAt !== undefined && { endsAt: input.endsAt }),
      },
    })
    return serialize(row)
  },

  async toggle(id: string, active: boolean): Promise<PromotionRow> {
    const row = await db.promotion.update({ where: { id }, data: { active: !active } })
    return serialize(row)
  },

  async delete(id: string): Promise<void> {
    await db.promotion.delete({ where: { id } })
  },
}

// ---------------------------------------------------------------------------
// Serializer — convierte Decimal a number
// ---------------------------------------------------------------------------

function serialize(row: {
  id: string
  name: string
  description: string | null
  type: PromotionType
  active: boolean
  minAmount: unknown
  discountAmount: unknown
  discountPercent: unknown
  startsAt: Date | null
  endsAt: Date | null
  createdAt: Date
  updatedAt: Date
}): PromotionRow {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    type: row.type,
    active: row.active,
    minAmount: row.minAmount != null ? Number(row.minAmount) : null,
    discountAmount: row.discountAmount != null ? Number(row.discountAmount) : null,
    discountPercent: row.discountPercent != null ? Number(row.discountPercent) : null,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}
