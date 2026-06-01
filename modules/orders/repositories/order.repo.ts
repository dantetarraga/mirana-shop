import type { OrderStatus, PaymentMethod, PaymentStatus } from '@/generated/prisma/client'
import type { Decimal } from '@/generated/prisma/internal/prismaNamespace'
import { db } from '@/shared/lib/db'

// ---------------------------------------------------------------------------
// Tipos de retorno del dominio Orders
// ---------------------------------------------------------------------------

export type OrderItemRow = {
  id: string
  productId: string
  productName: string
  productSku: string
  quantity: number
  unitPrice: Decimal
}

export type OrderListItem = {
  id: string
  code: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  total: Decimal
  subtotal: Decimal
  shippingCost: Decimal
  currency: string
  createdAt: Date
  updatedAt: Date
  user: { id: string; name: string | null; email: string } | null
  guestEmail: string | null
  shipping: { fullName: string; city: string; district: string; phone: string } | null
  _count: { items: number }
}

export type OrderDetail = OrderListItem & {
  items: OrderItemRow[]
  payment: {
    id: string
    method: string
    status: PaymentStatus
    amount: Decimal
    proofUrl: string | null
  } | null
  notes: string | null
  paidAt: Date | null
  cancelledAt: Date | null
}

export type OrderStatusGroup = 'pendiente' | 'enviado' | 'entregado' | 'cancelado'

// ---------------------------------------------------------------------------
// Checkout — input para crear órdenes desde el storefront
// ---------------------------------------------------------------------------

export type CreateOrderInput = {
  guestEmail?: string
  userId?: string
  paymentMethod: PaymentMethod
  items: Array<{
    productId: string
    productName: string
    productSku: string
    quantity: number
    unitPrice: number
  }>
  subtotal: number
  shippingCost: number
  total: number
  shipping: {
    fullName: string
    phone: string
    address: string
    district: string
    city: string
    reference?: string
  }
}

const STATUS_GROUP_MAP: Record<OrderStatusGroup, OrderStatus[]> = {
  pendiente: ['PENDING', 'AWAITING_PROOF', 'PAID', 'PREPARING'],
  enviado: ['SHIPPED'],
  entregado: ['DELIVERED'],
  cancelado: ['CANCELLED', 'REFUNDED'],
}

export type OrderFilters = {
  status?: OrderStatus
  statusGroup?: OrderStatusGroup
  paymentStatus?: PaymentStatus
  search?: string
  take?: number
  skip?: number
}

// ---------------------------------------------------------------------------
// Selects reutilizables
// ---------------------------------------------------------------------------

const listSelect = {
  id: true,
  code: true,
  status: true,
  paymentStatus: true,
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

const detailSelect = {
  ...listSelect,
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

// ---------------------------------------------------------------------------
// OrderRepo
// ---------------------------------------------------------------------------

export const orderRepo = {
  async findMany(filters: OrderFilters = {}): Promise<OrderListItem[]> {
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
              { code: { contains: search, mode: 'insensitive' } },
              { user: { name: { contains: search, mode: 'insensitive' } } },
              { user: { email: { contains: search, mode: 'insensitive' } } },
              { guestEmail: { contains: search, mode: 'insensitive' } },
              { shipping: { fullName: { contains: search, mode: 'insensitive' } } },
            ]
          : undefined,
      },
      select: listSelect,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }) as Promise<OrderListItem[]>
  },

  async findById(id: string): Promise<OrderDetail | null> {
    return db.order.findUnique({
      where: { id },
      select: detailSelect,
    }) as Promise<OrderDetail | null>
  },

  async findByCode(code: string): Promise<OrderDetail | null> {
    return db.order.findUnique({
      where: { code },
      select: detailSelect,
    }) as Promise<OrderDetail | null>
  },

  async count(filters: Omit<OrderFilters, 'take' | 'skip'> = {}): Promise<number> {
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
              { code: { contains: search, mode: 'insensitive' } },
              { user: { name: { contains: search, mode: 'insensitive' } } },
              { guestEmail: { contains: search, mode: 'insensitive' } },
            ]
          : undefined,
      },
    })
  },

  async updateStatus(
    id: string,
    status: OrderStatus,
    options: { cancelledAt?: Date; paidAt?: Date } = {},
  ): Promise<OrderListItem> {
    return db.order.update({
      where: { id },
      data: {
        status,
        cancelledAt: options.cancelledAt ?? undefined,
        paidAt: options.paidAt ?? undefined,
      },
      select: listSelect,
    }) as Promise<OrderListItem>
  },

  async getStats(): Promise<{
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
  },

  // Ingresos por mes — últimos 12 meses (para el gráfico de área)
  async getRevenueByMonth(): Promise<{ m: string; v: number }[]> {
    const rows = await db.$queryRaw<{ month: Date; revenue: number }[]>`
      SELECT
        DATE_TRUNC('month', "createdAt") AS month,
        COALESCE(SUM(total)::float, 0)   AS revenue
      FROM "Order"
      WHERE "createdAt" >= NOW() - INTERVAL '12 months'
        AND status NOT IN ('CANCELLED', 'REFUNDED')
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `
    return rows.map((r) => ({
      m: new Date(r.month).toLocaleDateString('es-PE', { month: 'short' }),
      v: Math.round((Number(r.revenue) / 1000) * 10) / 10, // en miles con 1 decimal
    }))
  },

  // Pedidos por día — últimos N días (para el gráfico de barras)
  async getOrdersByDay(days = 14): Promise<{ d: string; v: number }[]> {
    const rows = await db.$queryRaw<{ day: Date; count: number }[]>`
      SELECT
        DATE_TRUNC('day', "createdAt") AS day,
        COUNT(*)::int                  AS count
      FROM "Order"
      WHERE "createdAt" >= NOW() - INTERVAL '1 day' * ${days}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY day ASC
    `
    // Rellenar días sin pedidos con 0
    const map = new Map(
      rows.map((r) => [new Date(r.day).toISOString().slice(0, 10), Number(r.count)]),
    )
    return Array.from({ length: days }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (days - 1 - i))
      const key = d.toISOString().slice(0, 10)
      return {
        d: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
        v: map.get(key) ?? 0,
      }
    })
  },

  // Pedidos por categoría (para el donut)
  async getOrdersByCategory(): Promise<{ name: string; value: number }[]> {
    const rows = await db.$queryRaw<{ category: string; total: number }[]>`
      SELECT
        c.name              AS category,
        COUNT(oi.id)::int   AS total
      FROM "OrderItem" oi
      JOIN "Product"  p ON p.id = oi."productId"
      JOIN "Category" c ON c.id = p."categoryId"
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
  },

  // ---------------------------------------------------------------------------
  // create — crea una orden desde el checkout del storefront
  // ---------------------------------------------------------------------------
  async create(input: CreateOrderInput): Promise<{ id: string; code: string }> {
    const year = new Date().getFullYear()
    const count = await db.order.count()
    const code = `MIR-${year}-${String(count + 1).padStart(4, '0')}`

    // WHATSAPP_TRANSFER espera comprobante → AWAITING_PROOF
    const initialStatus: OrderStatus =
      input.paymentMethod === 'WHATSAPP_TRANSFER' ? 'AWAITING_PROOF' : 'PENDING'

    const order = await db.order.create({
      data: {
        code,
        guestEmail: input.guestEmail,
        userId: input.userId,
        paymentMethod: input.paymentMethod,
        status: initialStatus,
        paymentStatus: 'UNPAID',
        subtotal: input.subtotal,
        shippingCost: input.shippingCost,
        total: input.total,
        currency: 'PEN',
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            productSku: item.productSku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
        payment: {
          create: {
            method: input.paymentMethod,
            status: 'UNPAID',
            amount: input.total,
            currency: 'PEN',
          },
        },
        shipping: {
          create: {
            fullName: input.shipping.fullName,
            phone: input.shipping.phone,
            address: input.shipping.address,
            district: input.shipping.district,
            city: input.shipping.city,
            reference: input.shipping.reference,
          },
        },
      },
      select: { id: true, code: true },
    })

    return order
  },
}
