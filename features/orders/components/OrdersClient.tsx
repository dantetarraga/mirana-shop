"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { AdminDrawer } from "@/shared/components/AdminDrawer";
import { AdminTable, type Column } from "@/shared/components/AdminTable";
import { DrawerSection } from "@/shared/components/DrawerSection";
import { KpiCard } from "@/shared/components/KpiCard";
import { ServerSearchForm } from "@/shared/components/ServerSearchForm";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Button } from "@/shared/components/ui/Button";
import { cls } from "@/shared/lib/admin-classes";
import { ORDER_STATUS, fmt } from "@/shared/lib/admin-constants";
import { cn } from "@/shared/lib/utils";
import { updateOrderStatus } from "@/features/orders/actions/order.actions";
import type { OrderListItem } from "@/modules/orders/repositories/order.repo";
import type { OrderStatus } from "@/generated/prisma/client";

// ---------------------------------------------------------------------------
// Tipos serializados (Decimals ya convertidos a number en el Server Component)
// ---------------------------------------------------------------------------

type SerializedOrder = Omit<OrderListItem, "total" | "subtotal" | "shippingCost"> & {
  total: number;
  subtotal: number;
  shippingCost: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UI_STATUS_LABELS: Record<string, string> = {
  PENDING:        "Pendiente",
  AWAITING_PROOF: "Esperando comprobante",
  PAID:           "Pagado",
  PREPARING:      "Preparando",
  SHIPPED:        "Enviado",
  DELIVERED:      "Entregado",
  CANCELLED:      "Cancelado",
  REFUNDED:       "Reembolsado",
};

const DB_TO_UI_STATUS: Record<string, string> = {
  PENDING: "pendiente", AWAITING_PROOF: "pendiente",
  PAID: "pendiente",    PREPARING: "pendiente",
  SHIPPED: "enviado",   DELIVERED: "entregado",
  CANCELLED: "cancelado", REFUNDED: "cancelado",
};

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
}

function buildUrl(base: string, params: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) p.set(k, v);
  }
  const qs = p.toString();
  return qs ? `${base}?${qs}` : base;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface OrderStats { total: number; pending: number; shipped: number; delivered: number; cancelled: number; revenue: number }

interface OrdersClientProps {
  orders:       SerializedOrder[];
  stats:        OrderStats;
  total:        number;
  currentPage:  number;
  perPage:      number;
  currentQ:     string;
  currentGroup: string;
}

const FILTER_TABS = [
  { key: "",           label: "Todos" },
  { key: "pendiente",  label: "Pendientes" },
  { key: "enviado",    label: "Enviados" },
  { key: "entregado",  label: "Entregados" },
  { key: "cancelado",  label: "Cancelados" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OrdersClient({
  orders, stats, total, currentPage, perPage, currentQ, currentGroup,
}: OrdersClientProps) {
  const [detail, setDetail] = useState<SerializedOrder | null>(null);
  const [localOrders, setLocalOrders] = useState(orders);
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.ceil(total / perPage);

  const handleStatusChange = (orderId: string, status: OrderStatus) => {
    startTransition(async () => {
      const result = await updateOrderStatus({ orderId, status });
      if (result.success) {
        setLocalOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
        setDetail((d) => d?.id === orderId ? { ...d, status } : d);
        toast.success(`Estado: ${UI_STATUS_LABELS[status]}`);
      } else {
        toast.error(result.error);
      }
    });
  };

  const columns = useMemo<Column<SerializedOrder>[]>(() => [
    { header: "Pedido",   className: cls.monoGold, render: (o) => o.code },
    {
      header: "Cliente",
      render: (o) => {
        const name = o.user?.name ?? o.shipping?.fullName ?? o.guestEmail ?? "Invitado";
        return (
          <>
            <div className={cn(cls.rowName, "text-[14px]")}>{name}</div>
            <div className={cls.rowSub}>{o.shipping?.city ?? ""}</div>
          </>
        );
      },
    },
    { header: "Artículos", className: cls.val,                        render: (o) => o._count.items },
    { header: "Fecha",     className: "text-[13px] text-muted",       render: (o) => fmtDate(o.createdAt) },
    { header: "Total",     className: cls.valGold,                    render: (o) => `S/ ${fmt(o.total)}` },
    {
      header: "Estado",
      render: (o) => {
        const ui = DB_TO_UI_STATUS[o.status] ?? "pendiente";
        return <StatusBadge config={ORDER_STATUS[ui] ?? ORDER_STATUS.pendiente} variant="filled" />;
      },
    },
    { header: "", className: "text-right text-muted", render: () => "→" },
  ], []);

  return (
    <div className="px-8 pt-7 pb-12">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total pedidos"  value={stats.total}                              valueClass="text-text" />
        <KpiCard label="Por procesar"   value={stats.pending}                            valueClass="text-[#ffb84a]" />
        <KpiCard label="En tránsito"    value={stats.shipped}                            valueClass="text-[#5f9eff]" />
        <KpiCard label="Ingresos"       value={`S/ ${(stats.revenue / 1000).toFixed(1)}K`} valueClass="text-(--gold)" />
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
            const href = buildUrl("/admin/orders", { q: currentQ || undefined, statusGroup: key || undefined });
            return (
              <a key={key} href={href}
                className={cn(
                  "px-3.5 py-2 text-[11px] tracking-[1px] uppercase font-display font-extrabold border transition-colors",
                  isActive
                    ? "bg-(--gold) border-(--gold) text-black"
                    : "border-(--bd) text-muted hover:text-text hover:border-(--bd)"
                )}
              >
                {label}
              </a>
            );
          })}
        </div>
        {(currentQ || currentGroup) && (
          <a href="/admin/orders" className="text-[12px] text-muted hover:text-text transition-colors">
            Limpiar
          </a>
        )}
      </div>

      <AdminTable
        columns={columns}
        data={localOrders}
        keyExtractor={(o) => o.id}
        onRowClick={setDetail}
      />

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex gap-2 justify-end mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a key={p}
              href={buildUrl("/admin/orders", { q: currentQ || undefined, statusGroup: currentGroup || undefined, page: String(p) })}
              className={cn(
                "px-3 py-1.5 text-[13px] border transition-colors",
                p === currentPage ? "bg-(--gold) border-(--gold) text-black font-bold" : "border-(--bd) text-muted hover:text-text"
              )}
            >
              {p}
            </a>
          ))}
        </div>
      )}

      {/* Drawer de detalle */}
      {detail && (
        <AdminDrawer title={detail.code} sub="Detalle de pedido" onClose={() => setDetail(null)}>
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
                S/ {fmt(detail.total)}
              </span>
            </div>
          </DrawerSection>

          <DrawerSection title="Cambiar estado">
            <div className="flex flex-wrap gap-2">
              {(["PENDING","AWAITING_PROOF","PAID","PREPARING","SHIPPED","DELIVERED","CANCELLED","REFUNDED"] as OrderStatus[]).map((s) => {
                const ui = DB_TO_UI_STATUS[s] ?? "pendiente";
                const config = ORDER_STATUS[ui] ?? ORDER_STATUS.pendiente;
                return (
                  <Button key={s} variant="outline" size="sm"
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
