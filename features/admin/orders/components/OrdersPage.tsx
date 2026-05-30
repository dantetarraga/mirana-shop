"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { AdminDrawer } from "@/features/admin/_shared/components/AdminDrawer";
import type { Order } from "@/features/admin/_shared/lib/admin.types";
import { ORDER_STATUS, fmt, orderTotal, fmtDate } from "@/features/admin/dashboard/lib/admin-constants";
import { FilterBar } from "@/features/admin/_shared/components/FilterBar";
import { StatusBadge } from "@/features/admin/_shared/components/StatusBadge";
import { KpiCard } from "@/features/admin/_shared/components/KpiCard";
import { Button } from "@/components/ui/Button";
import { useAdminStore } from "@/stores/admin.store";
import { A } from "@/features/admin/_shared/lib/admin-classes";

export function OrdersPage() {
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
    .filter((o) =>
      !query ||
      o.customer.toLowerCase().includes(query.toLowerCase()) ||
      o.id.toLowerCase().includes(query.toLowerCase())
    );

  const revenue = orders
    .filter((o) => o.status !== "cancelado")
    .reduce((s, o) => s + orderTotal(o), 0);

  const tabs = [
    { key: "todos",     label: "Todos",      count: counts.todos },
    { key: "pendiente", label: "Pendientes", count: counts.pendiente },
    { key: "enviado",   label: "Enviados",   count: counts.enviado },
    { key: "entregado", label: "Entregados", count: counts.entregado },
    { key: "cancelado", label: "Cancelados", count: counts.cancelado },
  ];

  return (
    <div className="px-8 pt-7 pb-12">
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total pedidos"  value={orders.length}                      valueClass="text-text" />
        <KpiCard label="Por procesar"   value={counts.pendiente}                   valueClass="text-[#ffb84a]" />
        <KpiCard label="En tránsito"    value={counts.enviado}                     valueClass="text-[#5f9eff]" />
        <KpiCard label="Ingresos"       value={`$${(revenue / 1000).toFixed(1)}K`} valueClass="text-[var(--gold)]" />
      </div>

      <FilterBar
        query={query}
        placeholder="Buscar pedido o cliente..."
        activeTab={filter}
        tabs={tabs}
        onQuery={setQuery}
        onTab={setFilter}
      />

      <div className={A.panelTable}>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Pedido", "Cliente", "Artículos", "Fecha", "Pago", "Total", "Estado", ""].map((h) => (
                <th key={h} className={A.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className="cursor-pointer" onClick={() => setDetail(o)}>
                <td className={cn(A.td, A.monoGold)}>{o.id}</td>
                <td className={A.td}>
                  <div className={cn(A.rowName, "text-[14px]")}>{o.customer}</div>
                  <div className={A.rowSub}>{o.city}</div>
                </td>
                <td className={cn(A.td, A.val)}>{o.items.reduce((s, i) => s + i.qty, 0)}</td>
                <td className={cn(A.td, "text-[13px] text-muted")}>{fmtDate(o.date)}</td>
                <td className={cn(A.td, "text-[13px]")}>{o.payment}</td>
                <td className={cn(A.td, A.valGold)}>${fmt(orderTotal(o))}</td>
                <td className={A.td}>
                  <StatusBadge config={ORDER_STATUS[o.status]} variant="filled" />
                </td>
                <td className={cn(A.td, "text-right text-muted")}>→</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detail && (
        <AdminDrawer title={detail.id} sub="Detalle de pedido" onClose={() => setDetail(null)}>
          <div>
            <div className={cn(A.label, "mb-[10px]")}>Cliente</div>
            <div className="font-display text-[22px] font-black uppercase">{detail.customer}</div>
            <div className="text-[13px] text-muted">{detail.email} · {detail.city}</div>
          </div>
          <div className="pt-[18px] border-t border-[var(--bd)]">
            <div className={cn(A.label, "mb-[10px]")}>Artículos</div>
            {detail.items.map((it, i) => (
              <div key={i} className="flex justify-between py-2">
                <span className="text-[14px]">{it.qty}× {it.name}</span>
                <span className="font-display font-extrabold text-[15px] text-[var(--gold)]">
                  ${fmt(it.price * it.qty)}
                </span>
              </div>
            ))}
            <div className="flex justify-between items-baseline mt-2 pt-[14px] border-t border-[var(--bd)]">
              <span className="text-[12px] tracking-[1px] uppercase text-muted">Total</span>
              <span className="font-display font-black text-[26px] text-[var(--gold)]">
                ${fmt(orderTotal(detail))}
              </span>
            </div>
          </div>
          <div className="pt-[18px] border-t border-[var(--bd)]">
            <div className={cn(A.label, "mb-[10px]")}>Cambiar estado</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(ORDER_STATUS).map(([k, v]) => (
                <Button
                  key={k}
                  variant="outline"
                  size="sm"
                  onClick={() => { setOrderStatus(detail.id, k); setDetail({ ...detail, status: k as Order["status"] }); }}
                  className={detail.status === k ? v.btnCls : "text-muted"}
                >
                  {v.label}
                </Button>
              ))}
            </div>
          </div>
        </AdminDrawer>
      )}
    </div>
  );
}
