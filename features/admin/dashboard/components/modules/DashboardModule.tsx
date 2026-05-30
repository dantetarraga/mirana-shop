"use client";

import {
  AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CAT_STRIPE, type Product } from "@/shared/data/products";
import { ORDERS_DATA, SALES_DATA, ORDERS_DAILY, CATEGORY_PIE, PIE_COLORS, SPARK } from "@/features/admin/dashboard/lib/admin-data";
import { type Module, ORDER_STATUS, fmt, orderTotal, fmtDate } from "@/features/admin/dashboard/lib/admin-constants";
import { S } from "@/features/admin/dashboard/lib/admin-styles";
import { Button } from "@/components/ui/Button";

// ── SPARKLINE (SVG — ligero para KPIs) ────────────────────────────────────────
function Sparkline({ data, color = "#58aaff", w = 120, h = 36 }: { data: number[]; color?: string; w?: number; h?: number }) {
  const max = Math.max(...data), min = Math.min(...data), rng = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - ((v - min) / rng) * (h - 6) - 3]);
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = line + ` L${w} ${h} L0 ${h} Z`;
  const id = "sp" + w + h + color.replace(/[^a-z0-9]/gi, "");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill={color} />
    </svg>
  );
}

// ── CUSTOM RECHARTS TOOLTIP ───────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label, prefix = "$", suffix = "K" }: { active?: boolean; payload?: ReadonlyArray<any>; label?: string | number; prefix?: string; suffix?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--card-h)", border: "1px solid var(--gold)", padding: "8px 14px" }}>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: "var(--gold)" }}>
        {prefix}{payload[0].value}{suffix}
      </div>
      <div style={{ fontSize: 10, color: "var(--mt)", letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

export function DashboardModule({ products, orders, onGoto }: { products: Product[]; orders: typeof ORDERS_DATA; onGoto: (m: Module) => void }) {
  const topProducts = [...products].sort((a, b) => b.stock - a.stock).slice(0, 5);
  const maxStock = Math.max(...topProducts.map((p) => p.stock));

  return (
    <div style={{ padding: "28px 32px 48px" }}>
      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Ingresos (mes)", value: "$71.6K", delta: "↑ 15.3%", data: SPARK.revenue, color: "#58aaff" },
          { label: "Pedidos",         value: "247",    delta: "↑ 8.1%",  data: SPARK.orders,  color: "#5f9eff" },
          { label: "Clientes nuevos", value: "63",     delta: "↑ 22.4%", data: SPARK.users,   color: "#7b5fff" },
          { label: "Ticket promedio", value: "$124",   delta: "↑ 3.2%",  data: SPARK.ticket,  color: "#3fcf7f" },
        ].map((k) => (
          <div key={k.label} style={S.kpi}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--mt)" }}>{k.label}</span>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 12, color: "#3fcf7f" }}>{k.delta}</span>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 42, fontWeight: 900, lineHeight: 1, letterSpacing: -1, marginBottom: 12 }}>{k.value}</div>
            <Sparkline data={k.data} color={k.color} w={160} h={40} />
          </div>
        ))}
      </div>

      {/* Charts row — Área + Donut */}
      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={S.panel}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--gold)", marginBottom: 5 }}>Ingresos</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 900, textTransform: "uppercase" }}>Ventas últimos 12 meses</div>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 900, textAlign: "right" }}>
              $667.9K
              <span style={{ display: "block", fontSize: 10, fontWeight: 500, color: "var(--mt)", letterSpacing: 1, textTransform: "uppercase" }}>total anual</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={SALES_DATA} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#58aaff" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#58aaff" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(80,150,255,.1)" />
              <XAxis dataKey="m" tick={{ fill: "rgba(240,238,232,.42)", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(240,238,232,.42)", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}K`} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="v" stroke="#58aaff" strokeWidth={2.5} fill="url(#areaGrad)" dot={false} activeDot={{ r: 5, fill: "#58aaff", stroke: "var(--surf)", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={S.panel}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--gold)", marginBottom: 5 }}>Distribución</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 900, textTransform: "uppercase" }}>Ventas por categoría</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={CATEGORY_PIE} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" strokeWidth={0}>
                {CATEGORY_PIE.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v}%`, "Ventas"]} contentStyle={{ background: "var(--card-h)", border: "1px solid var(--gold)", borderRadius: 0 }} labelStyle={{ color: "var(--mt)" }} itemStyle={{ color: "var(--text)" }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
            {CATEGORY_PIE.map((d, i) => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 10, height: 10, background: PIE_COLORS[i], flexShrink: 0 }} />
                <span style={{ fontSize: 13, flex: 1 }}>{d.name}</span>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16 }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Barras + Top productos */}
      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={S.panel}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--gold)", marginBottom: 5 }}>Rendimiento</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 900, textTransform: "uppercase" }}>Pedidos últimos 14 días</div>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 900, textAlign: "right" }}>
              +18%
              <span style={{ display: "block", fontSize: 10, fontWeight: 500, color: "var(--mt)", letterSpacing: 1, textTransform: "uppercase" }}>vs anterior</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={ORDERS_DAILY} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(80,150,255,.1)" vertical={false} />
              <XAxis dataKey="d" tick={{ fill: "rgba(240,238,232,.42)", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={(props) => <ChartTooltip {...props} prefix="" suffix=" pedidos" />} />
              <Bar dataKey="v" fill="var(--card-h)" radius={[2, 2, 0, 0]} activeBar={{ fill: "#58aaff", stroke: "#58aaff", strokeWidth: 1 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={S.panel}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--gold)", marginBottom: 5 }}>Más vendidos</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 900, textTransform: "uppercase" }}>Top productos</div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onGoto("products")}>Ver todos →</Button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {topProducts.map((p, i) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 18, color: "var(--mt)", width: 18 }}>{i + 1}</span>
                <div className={CAT_STRIPE[p.cat]} style={{ width: 40, height: 40, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 5 }}>{p.name}</div>
                  <div style={{ height: 5, background: "var(--sub)", overflow: "hidden" }}>
                    <span style={{ display: "block", height: "100%", background: "var(--gold)", width: `${(p.stock / maxStock) * 100}%` }} />
                  </div>
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 18, textAlign: "right" }}>
                  {p.stock}<span style={{ display: "block", fontSize: 9, fontWeight: 500, color: "var(--mt)", letterSpacing: 1, textTransform: "uppercase" }}>uds</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div style={S.panel}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--gold)", marginBottom: 5 }}>Actividad reciente</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 900, textTransform: "uppercase" }}>Últimos pedidos</div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onGoto("orders")}>Ver todos →</Button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Pedido", "Cliente", "Fecha", "Total", "Estado"].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {orders.slice(0, 5).map((o) => (
              <tr key={o.id}>
                <td style={{ ...S.td, fontFamily: "monospace", fontSize: 12, color: "var(--gold)" }}>{o.id}</td>
                <td style={S.td}><div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, textTransform: "uppercase" }}>{o.customer}</div></td>
                <td style={{ ...S.td, color: "var(--mt)", fontSize: 13 }}>{fmtDate(o.date)}</td>
                <td style={{ ...S.td, fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--gold)", fontSize: 16 }}>${fmt(orderTotal(o))}</td>
                <td style={S.td}><span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", padding: "4px 11px", color: ORDER_STATUS[o.status].color, background: ORDER_STATUS[o.status].bg }}>{ORDER_STATUS[o.status].label}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
