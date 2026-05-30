"use client";

import { useState } from "react";
import { AdminDrawer } from "@/features/admin/dashboard/components/AdminDrawer";
import { USERS_DATA } from "@/features/admin/dashboard/lib/admin-data";
import { USER_STATUS, fmt } from "@/features/admin/dashboard/lib/admin-constants";
import { S } from "@/features/admin/dashboard/lib/admin-styles";
import { Button } from "@/components/ui/Button";
import { Search } from "lucide-react";

export function UsersModule() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("todos");
  const [detail, setDetail] = useState<typeof USERS_DATA[number] | null>(null);
  const list = USERS_DATA.filter(u =>
    (filter === "todos" || u.status === filter) &&
    (u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div style={{ padding: "28px 32px 48px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, background: "var(--card)", border: "1px solid var(--bd)", padding: "0 14px", height: 42, flex: 1, minWidth: 200, maxWidth: 340 }}>
          <Search size={13} style={{ color: "var(--mt)" }} />
          <input placeholder="Buscar usuario..." value={q} onChange={e => setQ(e.target.value)} style={{ background: "none", border: "none", outline: "none", color: "var(--text)", fontFamily: "var(--font-sans)", fontSize: 14, width: "100%" }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[["todos", "Todos"], ["vip", "VIP"], ["activo", "Activos"], ["nuevo", "Nuevos"]].map(([k, l]) => (
            <Button key={k} variant="tab" size="sm" active={filter === k} onClick={() => setFilter(k)}>{l}</Button>
          ))}
        </div>
      </div>
      <div style={{ ...S.panel, padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Usuario", "Pedidos", "Gastado", "Desde", "Segmento"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {list.map(u => (
              <tr key={u.id} style={{ cursor: "pointer" }} onClick={() => setDetail(u)}>
                <td style={S.td}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 38, height: 38, background: "var(--card-h)", border: "1px solid var(--bd)", color: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 14, flexShrink: 0 }}>
                      {u.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, textTransform: "uppercase" }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: "var(--mt)" }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ ...S.td, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16 }}>{u.orders}</td>
                <td style={{ ...S.td, fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--gold)", fontSize: 16 }}>${fmt(u.spent)}</td>
                <td style={{ ...S.td, color: "var(--mt)", fontSize: 13 }}>{new Date(u.joined).toLocaleDateString("es-PE", { year: "numeric", month: "short" })}</td>
                <td style={S.td}>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", padding: "4px 11px", color: USER_STATUS[u.status].color, background: "var(--sub)", border: `1px solid ${USER_STATUS[u.status].color}44` }}>
                    {USER_STATUS[u.status].label}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {detail && (
        <AdminDrawer title={detail.name} sub="Perfil de cliente" onClose={() => setDetail(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {[["Pedidos", detail.orders], ["Gastado", `$${fmt(detail.spent)}`], ["Ticket", `$${fmt(detail.spent / detail.orders)}`]].map(([l, v]) => (
              <div key={String(l)} style={{ background: "var(--card)", border: "1px solid var(--bd)", padding: 14, textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 900, lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: "var(--mt)", marginTop: 5 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid var(--bd)", paddingTop: 18 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--mt)", marginBottom: 10 }}>Información</div>
            {[["Email", detail.email], ["Segmento", USER_STATUS[detail.status].label], ["Cliente desde", new Date(detail.joined).toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })]].map(([l, v]) => (
              <div key={String(l)} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0" }}>
                <span style={{ color: "var(--mt)" }}>{l}</span>
                <span style={{ fontWeight: l === "Segmento" ? 700 : 400, color: l === "Segmento" ? USER_STATUS[detail.status].color : "var(--text)" }}>{v}</span>
              </div>
            ))}
          </div>
        </AdminDrawer>
      )}
    </div>
  );
}
