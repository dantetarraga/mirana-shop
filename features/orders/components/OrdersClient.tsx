"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { AdminDrawer } from "@/shared/components/AdminDrawer";
import { AdminTable, type Column } from "@/shared/components/AdminTable";
import { DrawerSection } from "@/shared/components/DrawerSection";
import { FilterBar } from "@/shared/components/FilterBar";
import { KpiCard } from "@/shared/components/KpiCard";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Button } from "@/shared/components/ui/Button";
import { cls } from "@/shared/lib/admin-classes";
import { ORDER_STATUS, fmt } from "@/shared/lib/admin-constants";
import { cn } from "@/shared/lib/utils";
import { updateOrderStatus } from "@/features/orders/actions/order.actions";
import type { OrderListItem } from "@/modules/orders/repositories/order.repo";
import type { OrderStatus } from "@/generated/prisma/client";

// ---------------------------------------------------------------------------
// Mapeo de estados BD -> UI
// ---------------------------------------------------------------------------

const DB_TO_UI_STATUS: Record<string, string> = {
  PENDING: "pendiente",
  AWAITING_PROOF: "pendiente",
  PAID: "pendiente",
  PREPARING: "pendiente",
  SHIPPED: "enviado",
  DELIVERED: "entregado",
  CANCELLED: "cancelado",
  REFUNDED: "cancelado",
};

const UI_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  AWAITING_PROOF: "Esperando comprobante",
  PAID: "Pagado",
  PREPARING: "Preparando",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

function getUiStatus(status: string): string {
  return DB_TO_UI_STATUS[status] ?? "pendiente";
}

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
  });
}

// ---------------------------------------------------------------------------
// Stats del servidor
// ---------------------------------------------------------------------------

interface OrderStats {
  total: number;
  pending: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  revenue: unknown;
}

interface OrdersClientProps {
  initialOrders: OrderListItem[];
  initialStats: OrderStats;
}

const FILTER_TABS = [
  { key: "todos", label: "Todos" },
  { key: "pendiente", label: "Pendientes" },
  { key: "enviado", label: "Enviados" },
  { key: "entregado", label: "Entregados" },
  { key: "cancelado", label: "Cancelados" },
];

export function OrdersClient({ initialOrders, initialStats }: OrdersClientProps) {
  const [orders, setOrders] = useState<OrderListItem[]>(initialOrders);
  const [filter, setFilter] = useState("todos");
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<OrderListItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const counts = {
    todos: orders.length,
    pendiente: orders.filter((o) => getUiStatus(o.status) === "pendiente").length,
    enviado: orders.filter((o) => getUiStatus(o.status) === "enviado").length,
    entregado: orders.filter((o) => getUiStatus(o.status) === "entregado").length,
    cancelado: orders.filter((o) => getUiStatus(o.status) === "cancelado").length,
  };

  const filtered = orders
    .filter((o) => filter === "todos" || getUiStatus(o.status) === filter)
    .filter((o) => {
      if (!query) return true;
      const q = query.toLowerCase();
      const name = o.user?.name ?? o.shipping?.fullName ?? o.guestEmail ?? "";
      return (
        o.code.toLowerCase().includes(q) || name.toLowerCase().includes(q)
      );
    });

  const tabs = FILTER_TABS.map((t) => ({
    ...t,
    count: counts[t.key as keyof typeof counts],
  }));

  const revenueNum = typeof initialStats.revenue === "object"
    ? Number(initialStats.revenue)
    : Number(initialStats.revenue ?? 0);

  const handleStatusChange = (orderId: string, status: OrderStatus) => {
    startTransition(async () => {
      const result = await updateOrderStatus({ orderId, status });
      if (result.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status } : o))
        );
        if (detail?.id === orderId) {
          setDetail((d) => (d ? { ...d, status } : d));
        }
        toast.success(`Estado actualizado: ${UI_STATUS_LABELS[status]}`);
      } else {
        toast.error(result.error);
      }
    });
  };

  const columns = useMemo<Column<OrderListItem>[]>(
    () => [
      {
        header: "Pedido",
        className: cls.monoGold,
        render: (o) => o.code,
      },
      {
        header: "Cliente",
        render: (o) => {
          const name =
            o.user?.name ??
            o.shipping?.fullName ??
            o.guestEmail ??
            "Invitado";
          const city = o.shipping?.city ?? "";
          return (
            <>
              <div className={cn(cls.rowName, "text-[14px]")}>{name}</div>
              <div className={cls.rowSub}>{city}</div>
            </>
          );
        },
      },
      {
        header: "Artículos",
        className: cls.val,
        render: (o) => o._count.items,
      },
      {
        header: "Fecha",
        className: "text-[13px] text-muted",
        render: (o) => fmtDate(o.createdAt),
      },
      {
        header: "Total",
        className: cls.valGold,
        render: (o) => `S/ ${fmt(Number(o.total))}`,
      },
      {
        header: "Estado",
        render: (o) => {
          const uiStatus = getUiStatus(o.status);
          return (
            <StatusBadge
              config={ORDER_STATUS[uiStatus] ?? ORDER_STATUS.pendiente}
              variant="filled"
            />
          );
        },
      },
      { header: "", className: "text-right text-muted", render: () => "→" },
    ],
    []
  );

  return (
    <div className="px-8 pt-7 pb-12">
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Total pedidos"
          value={orders.length}
          valueClass="text-text"
        />
        <KpiCard
          label="Por procesar"
          value={counts.pendiente}
          valueClass="text-[#ffb84a]"
        />
        <KpiCard
          label="En tránsito"
          value={counts.enviado}
          valueClass="text-[#5f9eff]"
        />
        <KpiCard
          label="Ingresos"
          value={`S/ ${(revenueNum / 1000).toFixed(1)}K`}
          valueClass="text-(--gold)"
        />
      </div>

      <FilterBar
        query={query}
        placeholder="Buscar pedido o cliente..."
        activeTab={filter}
        tabs={tabs}
        onQuery={setQuery}
        onTab={setFilter}
      />

      <AdminTable
        columns={columns}
        data={filtered}
        keyExtractor={(o) => o.id}
        onRowClick={setDetail}
      />

      {detail && (
        <AdminDrawer
          title={detail.code}
          sub="Detalle de pedido"
          onClose={() => setDetail(null)}
        >
          <DrawerSection title="Cliente" divider={false}>
            <div className="font-display text-[22px] font-black uppercase">
              {detail.user?.name ?? detail.shipping?.fullName ?? detail.guestEmail ?? "Invitado"}
            </div>
            <div className="text-[13px] text-muted">
              {detail.user?.email ?? detail.guestEmail}
              {detail.shipping?.city ? ` · ${detail.shipping.city}` : ""}
            </div>
          </DrawerSection>

          <DrawerSection title="Resumen">
            <div className="flex justify-between items-baseline pt-2">
              <span className="text-[12px] tracking-[1px] uppercase text-muted">
                Total ({detail._count.items} artículo{detail._count.items !== 1 ? "s" : ""})
              </span>
              <span className="font-display font-black text-[26px] text-(--gold)">
                S/ {fmt(Number(detail.total))}
              </span>
            </div>
          </DrawerSection>

          <DrawerSection title="Cambiar estado">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  "PENDING",
                  "AWAITING_PROOF",
                  "PAID",
                  "PREPARING",
                  "SHIPPED",
                  "DELIVERED",
                  "CANCELLED",
                  "REFUNDED",
                ] as OrderStatus[]
              ).map((s) => {
                const uiStatus = getUiStatus(s);
                const config = ORDER_STATUS[uiStatus] ?? ORDER_STATUS.pendiente;
                return (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    disabled={isPending || detail.status === s}
                    onClick={() => handleStatusChange(detail.id, s)}
                    className={detail.status === s ? config.btnCls : "text-muted"}
                  >
                    {UI_STATUS_LABELS[s]}
                  </Button>
                );
              })}
            </div>
          </DrawerSection>
        </AdminDrawer>
      )}
    </div>
  );
}
