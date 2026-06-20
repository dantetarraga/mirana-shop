import { orderRepo, type OrderStatusGroup } from "@/features/orders/services/order.service";
import { OrdersClient } from "@/features/orders/components/OrdersClient";

const PER_PAGE = 30;

const VALID_GROUPS = new Set<OrderStatusGroup>(["pendiente", "enviado", "entregado", "cancelado"]);

function toGroup(v: string | undefined): OrderStatusGroup | undefined {
  return v && VALID_GROUPS.has(v as OrderStatusGroup) ? (v as OrderStatusGroup) : undefined;
}

interface PageProps {
  searchParams: Promise<{ q?: string; statusGroup?: string; page?: string }>;
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const { q, statusGroup: rawGroup, page: rawPage } = await searchParams;
  const statusGroup = toGroup(rawGroup);
  const page = Math.max(1, Number(rawPage ?? 1));
  const skip = (page - 1) * PER_PAGE;

  const [orders, stats, total] = await Promise.all([
    orderRepo.findMany({ search: q, statusGroup, take: PER_PAGE, skip }),
    orderRepo.getStats(),
    orderRepo.count({ search: q, statusGroup }),
  ]);

  // Serializar Decimals antes de pasar al Client Component
  const serializedOrders = orders.map((o) => ({
    ...o,
    total:        Number(o.total),
    subtotal:     Number(o.subtotal),
    shippingCost: Number(o.shippingCost),
  }));

  const serializedStats = {
    ...stats,
    revenue: Number(stats.revenue),
  };

  return (
    <OrdersClient
      orders={serializedOrders}
      stats={serializedStats}
      total={total}
      currentPage={page}
      perPage={PER_PAGE}
      currentQ={q ?? ""}
      currentGroup={rawGroup ?? ""}
    />
  );
}
