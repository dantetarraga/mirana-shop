"use client";

import { useState } from "react";
import { AdminDrawer } from "@/features/admin/dashboard/components/AdminDrawer";
import { type Order, ORDER_STATUS, fmt, orderTotal, fmtDate } from "@/features/admin/dashboard/lib/admin-constants";
import { S } from "@/features/admin/dashboard/lib/admin-styles";
import { Button } from "@/components/ui/Button";
import { useAdminStore } from "@/stores/admin.store";

export function OrdersModule() {
  const orders = useAdminStore((s) => s.orders);
  const setOrderStatus = useAdminStore((s) => s.setOrderStatus);
  const [filter, setFilter] = useState("todos");
  const [detail, setDetail] = useState<Order | null>(null);
  const counts = {
    todos:     orders.length,
    pendiente: orders.filter(o => o.status === "pendiente").length,
    enviado:   orders.filter(o => o.status === "enviado").length,
    entregado: orders.filter(o => o.status === "entregado").length,
    cancelado: orders.filter(o => o.status === "cancelado").length,
  };
  const filtered = filter === "todos" ? orders : orders.filter(o => o.status === filter);
  const revenue = orders.filter(o => o.status !== "cancelado").reduce((s, o) => s + orderTotal(o), 0);

  return (
    <div style={{ padding: "28px 32px 48px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {[["Total pedidos", orders.length, "var(--text)"], ["Por procesar", counts.pendiente, "#ffb84a"], ["En tránsito", counts.enviado, "#5f9eff"], ["Ingresos", `$${(revenue / 1000).toFixed(1)}K`, "var(--gold)"]].map(([l, v, c]) => (
          <div key={String(l)} style={S.kpi}>
            <div style={{ fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--mt)", marginBottom: 8 }}>{l}</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 900, lineHeight: 1, letterSpacing: -1, color: c as string }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {Object.entries({ todos: "Todos", pendiente: "Pendientes", enviado: "Enviados", entregado: "Entregados", cancelado: "Cancelados" }).map(([k, l]) => (
          <Button key={k} variant="tab" size="sm" active={filter === k} onClick={() => setFilter(k)}>
            {l} <span style={{ fontSize: 12, opacity: .7 }}>{counts[k as keyof typeof counts]}</span>
          </Button>
        ))}
      </div>
      <div style={{ ...S.panel, padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Pedido", "Cliente", "Artículos", "Fecha", "Pago", "Total", "Estado", ""].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} style={{ cursor: "pointer" }} onClick={() => setDetail(o)}>
                <td style={{ ...S.td, fontFamily: "monospace", fontSize: 12, color: "var(--gold)" }}>{o.id}</td>
                <td style={S.td}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, textTransform: "uppercase" }}>{o.customer}</div>
                  <div style={{ fontSize: 11, color: "var(--mt)", textTransform: "uppercase", letterSpacing: 1 }}>{o.city}</div>
                </td>
                <td style={{ ...S.td, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16 }}>{o.items.reduce((s, i) => s + i.qty, 0)}</td>
                <td style={{ ...S.td, color: "var(--mt)", fontSize: 13 }}>{fmtDate(o.date)}</td>
                <td style={{ ...S.td, fontSize: 13 }}>{o.payment}</td>
                <td style={{ ...S.td, fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--gold)", fontSize: 16 }}>${fmt(orderTotal(o))}</td>
                <td style={S.td}><span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", padding: "4px 11px", color: ORDER_STATUS[o.status].color, background: ORDER_STATUS[o.status].bg }}>{ORDER_STATUS[o.status].label}</span></td>
                <td style={{ ...S.td, textAlign: "right", color: "var(--mt)" }}>→</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {detail && (
        <AdminDrawer title={detail.id} sub="Detalle de pedido" onClose={() => setDetail(null)}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--mt)", marginBottom: 10 }}>Cliente</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 900, textTransform: "uppercase" }}>{detail.customer}</div>
            <div style={{ fontSize: 13, color: "var(--mt)" }}>{detail.email} · {detail.city}</div>
          </div>
          <div style={{ borderTop: "1px solid var(--bd)", paddingTop: 18 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--mt)", marginBottom: 10 }}>Artículos</div>
            {detail.items.map((it, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                <span style={{ fontSize: 14 }}>{it.qty}× {it.name}</span>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--gold)", fontSize: 15 }}>${fmt(it.price * it.qty)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: "1px solid var(--bd)", marginTop: 8, paddingTop: 14 }}>
              <span style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: "var(--mt)" }}>Total</span>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, color: "var(--gold)", fontSize: 26 }}>${fmt(orderTotal(detail))}</span>
            </div>
          </div>
          <div style={{ borderTop: "1px solid var(--bd)", paddingTop: 18 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--mt)", marginBottom: 10 }}>Cambiar estado</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {Object.entries(ORDER_STATUS).map(([k, v]) => (
                <Button
                  key={k}
                  variant="outline"
                  size="sm"
                  onClick={() => { setOrderStatus(detail.id, k); setDetail({ ...detail, status: k }); }}
                  style={{
                    border: `1px solid ${detail.status === k ? v.color : "var(--bd)"}`,
                    background: detail.status === k ? v.bg : "none",
                    color: detail.status === k ? v.color : "var(--mt)",
                  }}
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
