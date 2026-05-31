"use client";

import { useMemo, useState } from "react";
import { cn } from "@/shared/lib/utils";
import { AdminDrawer } from "@/shared/components/AdminDrawer";
import { AdminTable, type Column } from "@/shared/components/AdminTable";
import { DrawerSection } from "@/shared/components/DrawerSection";
import { FilterBar } from "@/shared/components/FilterBar";
import { KpiCard } from "@/shared/components/KpiCard";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { Button } from "@/shared/components/ui/Button";
import { ORDER_STATUS, fmt, fmtDate, orderTotal } from "@/shared/lib/admin-constants";
import { useAdminStore } from "@/shared/stores/admin.store";
import type { Order } from "@/shared/types/admin-mock.types";
import { cls } from "@/shared/lib/admin-classes";

export default function OrdersPage() {
  const orders         = useAdminStore((s) => s.orders);
  const setOrderStatus = useAdminStore((s) => s.setOrderStatus);
  const [filter, setFilter] = useState("todos");
  const [query, setQuery]   = useState("");
  const [detail, setDetail] = useState<Order | null>(null);

  const counts = {
    todos:     orders.length,
    pendiente: orders.filter((o) => o.status === "pendiente").length,
    enviado:   orders.filter((o) => o.status === "enviado").length,
    entregado: orders.filter((o) => o.status === "entregado").length,
    cancelado: orders.filter((o) => o.status === "cancelado").length,
  };

  const filtered = orders
    .filter((o) => filter === "todos" || o.status === filter)
    .filter((o) => !query || o.customer.toLowerCase().includes(query.toLowerCase()) || o.id.toLowerCase().includes(query.toLowerCase()));

  const revenue = orders.filter((o) => o.status !== "cancelado").reduce((s, o) => s + orderTotal(o), 0);

  const tabs = [
    { key: "todos",     label: "Todos",      count: counts.todos },
    { key: "pendiente", label: "Pendientes", count: counts.pendiente },
    { key: "enviado",   label: "Enviados",   count: counts.enviado },
    { key: "entregado", label: "Entregados", count: counts.entregado },
    { key: "cancelado", label: "Cancelados", count: counts.cancelado },
  ];

  const columns = useMemo<Column<Order>[]>(() => [
    { header: "Pedido",    className: cls.monoGold, render: (o) => o.id },
    { header: "Cliente",   render: (o) => (
      <>
        <div className={cn(cls.rowName, "text-[14px]")}>{o.customer}</div>
        <div className={cls.rowSub}>{o.city}</div>
      </>
    )},
    { header: "Artículos", className: cls.val, render: (o) => o.items.reduce((s, i) => s + i.qty, 0) },
    { header: "Fecha",     className: "text-[13px] text-muted", render: (o) => fmtDate(o.date) },
    { header: "Pago",      className: "text-[13px]", render: (o) => o.payment },
    { header: "Total",     className: cls.valGold, render: (o) => `$${fmt(orderTotal(o))}` },
    { header: "Estado",    render: (o) => <StatusBadge config={ORDER_STATUS[o.status]} variant="filled" /> },
    { header: "",          className: "text-right text-muted", render: () => "→" },
  ], []);

  return (
    <div className="px-8 pt-7 pb-12">
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total pedidos" value={orders.length}                      valueClass="text-text" />
        <KpiCard label="Por procesar"  value={counts.pendiente}                   valueClass="text-[#ffb84a]" />
        <KpiCard label="En tránsito"   value={counts.enviado}                     valueClass="text-[#5f9eff]" />
        <KpiCard label="Ingresos"      value={`$${(revenue / 1000).toFixed(1)}K`} valueClass="text-(--gold)" />
      </div>

      <FilterBar query={query} placeholder="Buscar pedido o cliente..." activeTab={filter} tabs={tabs} onQuery={setQuery} onTab={setFilter} />

      <AdminTable
        columns={columns}
        data={filtered}
        keyExtractor={(o) => o.id}
        onRowClick={setDetail}
      />

      {detail && (
        <AdminDrawer title={detail.id} sub="Detalle de pedido" onClose={() => setDetail(null)}>
          <DrawerSection title="Cliente" divider={false}>
            <div className="font-display text-[22px] font-black uppercase">{detail.customer}</div>
            <div className="text-[13px] text-muted">{detail.email} · {detail.city}</div>
          </DrawerSection>
          <DrawerSection title="Artículos">
            {detail.items.map((it, i) => (
              <div key={i} className="flex justify-between py-2">
                <span className="text-[14px]">{it.qty}× {it.name}</span>
                <span className="font-display font-extrabold text-[15px] text-(--gold)">${fmt(it.price * it.qty)}</span>
              </div>
            ))}
            <div className="flex justify-between items-baseline mt-2 pt-3.5 border-t border-(--bd)">
              <span className="text-[12px] tracking-[1px] uppercase text-muted">Total</span>
              <span className="font-display font-black text-[26px] text-(--gold)">${fmt(orderTotal(detail))}</span>
            </div>
          </DrawerSection>
          <DrawerSection title="Cambiar estado">
            <div className="flex flex-wrap gap-2">
              {Object.entries(ORDER_STATUS).map(([k, v]) => (
                <Button key={k} variant="outline" size="sm"
                  onClick={() => { setOrderStatus(detail.id, k); setDetail({ ...detail, status: k as Order["status"] }); }}
                  className={detail.status === k ? v.btnCls : "text-muted"}
                >
                  {v.label}
                </Button>
              ))}
            </div>
          </DrawerSection>
        </AdminDrawer>
      )}
    </div>
  );
}
