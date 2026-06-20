import { countOrders, getOrders, getOrderStats } from "@/features/orders/queries/order.queries";
import type { OrderStatusGroup } from "@/features/orders/types";
import { OrdersClient } from "@/features/orders/components/OrdersClient";
import { KpiCard } from "@/features/dashboard/components/KpiCard";
import { ServerSearchForm } from "@/shared/components/admin/ServerSearchForm";
import { cn } from "@/shared/lib/utils";

const PER_PAGE = 30;

const VALID_GROUPS = new Set<OrderStatusGroup>(["pendiente", "enviado", "entregado", "cancelado"]);

function toGroup(v: string | undefined): OrderStatusGroup | undefined {
  return v && VALID_GROUPS.has(v as OrderStatusGroup) ? (v as OrderStatusGroup) : undefined;
}

const FILTER_TABS = [
  { key: "", label: "Todos" },
  { key: "pendiente", label: "Pendientes" },
  { key: "enviado", label: "Enviados" },
  { key: "entregado", label: "Entregados" },
  { key: "cancelado", label: "Cancelados" },
];

function buildUrl(params: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) p.set(k, v);
  }
  const qs = p.toString();
  return qs ? `/admin/orders?${qs}` : "/admin/orders";
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
    getOrders({ search: q, statusGroup, take: PER_PAGE, skip }),
    getOrderStats(),
    countOrders({ search: q, statusGroup }),
  ]);

  // Serializar Decimals antes de pasar al Client Component
  const serializedOrders = orders.map((o) => ({
    ...o,
    total:        Number(o.total),
    subtotal:     Number(o.subtotal),
    shippingCost: Number(o.shippingCost),
  }));

  const totalPages = Math.ceil(total / PER_PAGE);
  const currentQ = q ?? "";
  const currentGroup = rawGroup ?? "";

  return (
    <div className="px-8 pt-7 pb-12">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total pedidos" value={stats.total} valueClass="text-text" />
        <KpiCard label="Por procesar" value={stats.pending} valueClass="text-[#ffb84a]" />
        <KpiCard label="En tránsito" value={stats.shipped} valueClass="text-[#8b7cff]" />
        <KpiCard
          label="Ingresos"
          value={`S/ ${(Number(stats.revenue) / 1000).toFixed(1)}K`}
          valueClass="text-(--gold)"
        />
      </div>

      {/* Filtros server-side */}
      <div className="flex items-center gap-3.5 flex-wrap mb-4">
        <ServerSearchForm
          placeholder="Buscar pedido o cliente..."
          defaultValue={currentQ}
          paramName="q"
          extraParams={currentGroup ? { statusGroup: currentGroup } : {}}
        />
        <div className="flex gap-1.5">
          {FILTER_TABS.map(({ key, label }) => {
            const isActive = key === currentGroup;
            const href = buildUrl({
              q: currentQ || undefined,
              statusGroup: key || undefined,
            });
            return (
              <a
                key={key}
                href={href}
                className={cn(
                  "px-3.5 py-2 text-[11px] tracking-[1px] uppercase font-display font-extrabold border transition-colors",
                  isActive
                    ? "bg-(--gold) border-(--gold) text-black"
                    : "border-(--bd) text-muted hover:text-text hover:border-(--bd)",
                )}
              >
                {label}
              </a>
            );
          })}
        </div>
        {(currentQ || currentGroup) && (
          <a
            href="/admin/orders"
            className="text-[12px] text-muted hover:text-text transition-colors"
          >
            Limpiar
          </a>
        )}
      </div>

      <OrdersClient orders={serializedOrders} />

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex gap-2 justify-end mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={buildUrl({
                q: currentQ || undefined,
                statusGroup: currentGroup || undefined,
                page: String(p),
              })}
              className={cn(
                "px-3 py-1.5 text-[13px] border transition-colors",
                p === page
                  ? "bg-(--gold) border-(--gold) text-black font-bold"
                  : "border-(--bd) text-muted hover:text-text",
              )}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
