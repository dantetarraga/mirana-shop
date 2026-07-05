import 'server-only'
import type { Decimal } from '@/generated/prisma/internal/prismaNamespace'
import type { OrderStatus } from '@/generated/prisma/client'
import { db } from '@/shared/lib/db'
import { formatDate } from '@/shared/lib/utils'
import type { OrderDetail, OrderFilters, OrderListItem, OrderStatusGroup } from '@/features/orders/types'

const STATUS_GROUP_MAP: Record<OrderStatusGroup, OrderStatus[]> = {
  pendiente: ['PENDING', 'AWAITING_PROOF', 'PAID', 'PREPARING'],
  enviado: ['SHIPPED'],
  entregado: ['DELIVERED'],
  cancelado: ['CANCELLED', 'REFUNDED'],
}

export const ORDER_LIST_SELECT = {
  id: true,
  code: true,
  status: true,
  paymentStatus: true,
  paymentMethod: true,
  total: true,
  subtotal: true,
  shippingCost: true,
  currency: true,
  createdAt: true,
  updatedAt: true,
  guestEmail: true,
  user: { select: { id: true, name: true, email: true } },
  shipping: { select: { fullName: true, city: true, district: true, phone: true } },
  _count: { select: { items: true } },
} as const

export const ORDER_DETAIL_SELECT = {
  ...ORDER_LIST_SELECT,
  notes: true,
  paidAt: true,
  cancelledAt: true,
  items: {
    select: {
      id: true,
      productId: true,
      productName: true,
      productSku: true,
      quantity: true,
      unitPrice: true,
    },
  },
  payment: {
    select: {
      id: true,
      method: true,
      status: true,
      amount: true,
      proofUrl: true,
    },
  },
} as const

export async function getOrders(filters: OrderFilters = {}): Promise<OrderListItem[]> {
  const { status, statusGroup, paymentStatus, search, take = 50, skip = 0 } = filters

  const statusFilter = statusGroup
    ? { status: { in: STATUS_GROUP_MAP[statusGroup] } }
    : status
      ? { status }
      : {}

  return db.order.findMany({
    where: {
      ...statusFilter,
      paymentStatus: paymentStatus ?? undefined,
      OR: search
        ? [
            { code: { contains: search } },
            { user: { name: { contains: search } } },
            { user: { email: { contains: search } } },
            { guestEmail: { contains: search } },
            { shipping: { fullName: { contains: search } } },
          ]
        : undefined,
    },
    select: ORDER_LIST_SELECT,
    orderBy: { createdAt: 'desc' },
    take,
    skip,
  }) as Promise<OrderListItem[]>
}

export async function getOrderById(id: string): Promise<OrderDetail | null> {
  return db.order.findUnique({
    where: { id },
    select: ORDER_DETAIL_SELECT,
  }) as Promise<OrderDetail | null>
}

export async function getOrderByCode(code: string): Promise<OrderDetail | null> {
  return db.order.findUnique({
    where: { code },
    select: ORDER_DETAIL_SELECT,
  }) as Promise<OrderDetail | null>
}

export async function getOrdersByEmail(email: string, take = 20): Promise<OrderListItem[]> {
  return db.order.findMany({
    where: {
      OR: [
        { guestEmail: { equals: email } },
        { user: { email: { equals: email } } },
      ],
    },
    select: ORDER_LIST_SELECT,
    orderBy: { createdAt: 'desc' },
    take,
  }) as Promise<OrderListItem[]>
}

export async function countOrders(filters: Omit<OrderFilters, 'take' | 'skip'> = {}): Promise<number> {
  const { status, statusGroup, paymentStatus, search } = filters

  const statusFilter = statusGroup
    ? { status: { in: STATUS_GROUP_MAP[statusGroup] } }
    : status
      ? { status }
      : {}

  return db.order.count({
    where: {
      ...statusFilter,
      paymentStatus: paymentStatus ?? undefined,
      OR: search
        ? [
            { code: { contains: search } },
            { user: { name: { contains: search } } },
            { guestEmail: { contains: search } },
          ]
        : undefined,
    },
  })
}

export async function getOrderStats(): Promise<{
  total: number
  pending: number
  shipped: number
  delivered: number
  cancelled: number
  revenue: Decimal
}> {
  const [counts, revenue] = await Promise.all([
    db.order.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
    db.order.aggregate({
      _sum: { total: true },
      where: { status: { notIn: ['CANCELLED', 'REFUNDED'] } },
    }),
  ])

  const byStatus = Object.fromEntries(counts.map((r) => [r.status, r._count._all]))

  return {
    total: counts.reduce((s, r) => s + r._count._all, 0),
    pending: byStatus['PENDING'] ?? 0,
    shipped: byStatus['SHIPPED'] ?? 0,
    delivered: byStatus['DELIVERED'] ?? 0,
    cancelled: byStatus['CANCELLED'] ?? 0,
    revenue: revenue._sum.total ?? (0 as unknown as Decimal),
  }
}

// Ingresos por mes — últimos 12 meses (para el gráfico de área)
export async function getRevenueByMonth(): Promise<{ m: string; v: number }[]> {
  const rows = await db.$queryRaw<{ month: Date; revenue: number }[]>`
    SELECT
      CAST(DATE_FORMAT(createdAt, '%Y-%m-01') AS DATE) AS month,
      CAST(COALESCE(SUM(total), 0) AS DOUBLE)          AS revenue
    FROM \`Order\`
    WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      AND status NOT IN ('CANCELLED', 'REFUNDED')
    GROUP BY DATE_FORMAT(createdAt, '%Y-%m-01')
    ORDER BY month ASC
  `
  return rows.map((r) => ({
    m: formatDate(new Date(r.month), 'MMM'),
    v: Math.round((Number(r.revenue) / 1000) * 10) / 10, // en miles con 1 decimal
  }))
}

// Pedidos por día — últimos N días (para el gráfico de barras)
export async function getOrdersByDay(days = 14): Promise<{ d: string; v: number }[]> {
  const rows = await db.$queryRaw<{ day: Date; count: number }[]>`
    SELECT
      DATE(createdAt)              AS day,
      CAST(COUNT(*) AS SIGNED)     AS count
    FROM \`Order\`
    WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
    GROUP BY DATE(createdAt)
    ORDER BY day ASC
  `
  // Rellenar días sin pedidos con 0
  const map = new Map(rows.map((r) => [new Date(r.day).toISOString().slice(0, 10), Number(r.count)]))
  return Array.from({ length: days }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    const key = d.toISOString().slice(0, 10)
    return {
      d: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
      v: map.get(key) ?? 0,
    }
  })
}

// Pedidos por categoría (para el donut)
export async function getOrdersByCategory(): Promise<{ name: string; value: number }[]> {
  const rows = await db.$queryRaw<{ category: string; total: number }[]>`
    SELECT
      c.name                      AS category,
      CAST(COUNT(oi.id) AS SIGNED) AS total
    FROM \`OrderItem\` oi
    JOIN \`Product\`  p ON p.id = oi.productId
    JOIN \`Category\` c ON c.id = p.categoryId
    GROUP BY c.id, c.name
    ORDER BY total DESC
    LIMIT 5
  `
  if (rows.length === 0) return []
  const sum = rows.reduce((s, r) => s + Number(r.total), 0)
  return rows.map((r) => ({
    name: r.category,
    value: Math.round((Number(r.total) / sum) * 100),
  }))
}
