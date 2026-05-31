import { db } from "@/shared/lib/db";
import type { OrderStatus, PaymentStatus } from "../../../generated/prisma";
import type { Decimal } from "../../../generated/prisma/runtime/library";

// ---------------------------------------------------------------------------
// Tipos de retorno del dominio Orders
// ---------------------------------------------------------------------------

export type OrderItemRow = {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: Decimal;
};

export type OrderListItem = {
  id: string;
  code: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: Decimal;
  subtotal: Decimal;
  shippingCost: Decimal;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; name: string | null; email: string } | null;
  guestEmail: string | null;
  shipping: { fullName: string; city: string; district: string; phone: string } | null;
  _count: { items: number };
};

export type OrderDetail = OrderListItem & {
  items: OrderItemRow[];
  payment: {
    id: string;
    method: string;
    status: PaymentStatus;
    amount: Decimal;
    proofUrl: string | null;
  } | null;
  notes: string | null;
  paidAt: Date | null;
  cancelledAt: Date | null;
};

export type OrderFilters = {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
  take?: number;
  skip?: number;
};

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
} as const;

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
} as const;

// ---------------------------------------------------------------------------
// OrderRepo
// ---------------------------------------------------------------------------

export const orderRepo = {
  async findMany(filters: OrderFilters = {}): Promise<OrderListItem[]> {
    const { status, paymentStatus, search, take = 50, skip = 0 } = filters;

    return db.order.findMany({
      where: {
        status: status ?? undefined,
        paymentStatus: paymentStatus ?? undefined,
        OR: search
          ? [
              { code: { contains: search, mode: "insensitive" } },
              { user: { name: { contains: search, mode: "insensitive" } } },
              { user: { email: { contains: search, mode: "insensitive" } } },
              { guestEmail: { contains: search, mode: "insensitive" } },
              { shipping: { fullName: { contains: search, mode: "insensitive" } } },
            ]
          : undefined,
      },
      select: listSelect,
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }) as Promise<OrderListItem[]>;
  },

  async findById(id: string): Promise<OrderDetail | null> {
    return db.order.findUnique({
      where: { id },
      select: detailSelect,
    }) as Promise<OrderDetail | null>;
  },

  async findByCode(code: string): Promise<OrderDetail | null> {
    return db.order.findUnique({
      where: { code },
      select: detailSelect,
    }) as Promise<OrderDetail | null>;
  },

  async count(filters: Omit<OrderFilters, "take" | "skip"> = {}): Promise<number> {
    const { status, paymentStatus, search } = filters;
    return db.order.count({
      where: {
        status: status ?? undefined,
        paymentStatus: paymentStatus ?? undefined,
        OR: search
          ? [
              { code: { contains: search, mode: "insensitive" } },
              { user: { name: { contains: search, mode: "insensitive" } } },
              { guestEmail: { contains: search, mode: "insensitive" } },
            ]
          : undefined,
      },
    });
  },

  async updateStatus(
    id: string,
    status: OrderStatus,
    options: { cancelledAt?: Date; paidAt?: Date } = {}
  ): Promise<OrderListItem> {
    return db.order.update({
      where: { id },
      data: {
        status,
        cancelledAt: options.cancelledAt ?? undefined,
        paidAt: options.paidAt ?? undefined,
      },
      select: listSelect,
    }) as Promise<OrderListItem>;
  },

  async getStats(): Promise<{
    total: number;
    pending: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    revenue: Decimal;
  }> {
    const [counts, revenue] = await Promise.all([
      db.order.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      db.order.aggregate({
        _sum: { total: true },
        where: { status: { notIn: ["CANCELLED", "REFUNDED"] } },
      }),
    ]);

    const byStatus = Object.fromEntries(
      counts.map((r) => [r.status, r._count._all])
    );

    return {
      total: counts.reduce((s, r) => s + r._count._all, 0),
      pending: byStatus["PENDING"] ?? 0,
      shipped: byStatus["SHIPPED"] ?? 0,
      delivered: byStatus["DELIVERED"] ?? 0,
      cancelled: byStatus["CANCELLED"] ?? 0,
      revenue: revenue._sum.total ?? (0 as unknown as Decimal),
    };
  },
};
