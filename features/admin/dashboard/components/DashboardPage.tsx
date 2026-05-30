"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CAT_STRIPE } from "@/shared/data/products";
import { SALES_DATA, ORDERS_DAILY, CATEGORY_PIE, PIE_COLORS, SPARK } from "@/features/admin/dashboard/lib/admin-data";
import { ORDER_STATUS, fmt, orderTotal, fmtDate } from "@/features/admin/dashboard/lib/admin-constants";
import { KpiCard } from "@/features/admin/_shared/components/KpiCard";
import { StatusBadge } from "@/features/admin/_shared/components/StatusBadge";
import { useAdminStore } from "@/stores/admin.store";
import { A } from "@/features/admin/_shared/lib/admin-classes";

// ── SPARKLINE (SVG — ligero para KPIs) ────────────────────────────────────────
function Sparkline({ data, color = "#58aaff", w = 120, h = 36 }: { data: number[]; color?: string; w?: number; h?: number }) {
  const max = Math.max(...data), min = Math.min(...data), rng = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - ((v - min) / rng) * (h - 6) - 3]);
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = line + ` L${w} ${h} L0 ${h} Z`;
  const id = "sp" + w + h + color.replace(/[^a-z0-9]/gi, "");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          {/* stopColor es prop SVG/Recharts — se mantiene como attr */}
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
    <div className="px-[14px] py-2 bg-card-hover border border-[var(--gold)]">
      <div className="font-display font-extrabold text-[16px] text-[var(--gold)]">
        {prefix}{payload[0].value}{suffix}
      </div>
      <div className="text-[10px] tracking-[1px] uppercase text-muted">{label}</div>
    </div>
  );
}

export function DashboardPage() {
  const products = useAdminStore((s) => s.products);
  const orders   = useAdminStore((s) => s.orders);
  const topProducts = [...products].sort((a, b) => b.stock - a.stock).slice(0, 5);
  const maxStock    = Math.max(...topProducts.map((p) => p.stock));

  return (
    <div className="px-8 pt-7 pb-12">
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label: "Ingresos (mes)", value: "$71.6K", delta: "↑ 15.3%", data: SPARK.revenue, color: "#58aaff" },
          { label: "Pedidos",         value: "247",    delta: "↑ 8.1%",  data: SPARK.orders,  color: "#5f9eff" },
          { label: "Clientes nuevos", value: "63",     delta: "↑ 22.4%", data: SPARK.users,   color: "#7b5fff" },
          { label: "Ticket promedio", value: "$124",   delta: "↑ 3.2%",  data: SPARK.ticket,  color: "#3fcf7f" },
        ].map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value}>
            <div className="flex justify-between items-center mb-[10px]">
              <span className="font-display font-extrabold text-[12px] text-[#3fcf7f]">{k.delta}</span>
            </div>
            <Sparkline data={k.data} color={k.color} w={160} h={40} />
          </KpiCard>
        ))}
      </div>

      {/* Charts row — Área + Donut */}
      <div className="grid grid-cols-[1.55fr_1fr] gap-4 mb-4">
        <div className={A.panel}>
          <div className="flex justify-between items-start mb-5">
            <div>
              <div className={A.label}>Ingresos</div>
              <div className={A.title}>Ventas últimos 12 meses</div>
            </div>
            <div className="font-display text-[22px] font-black text-right">
              $667.9K
              <span className="block text-[10px] font-medium tracking-[1px] uppercase text-muted">total anual</span>
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

        <div className={A.panel}>
          <div className="mb-5">
            <div className={A.label}>Distribución</div>
            <div className={A.title}>Ventas por categoría</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={CATEGORY_PIE} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" strokeWidth={0}>
                {/* fill es prop SVG de Recharts — se mantiene como attr */}
                {CATEGORY_PIE.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v}%`, "Ventas"]} contentStyle={{ background: "var(--card-h)", border: "1px solid var(--gold)", borderRadius: 0 }} labelStyle={{ color: "var(--mt)" }} itemStyle={{ color: "var(--text)" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-[10px] mt-1">
            {CATEGORY_PIE.map((d, i) => (
              <div key={d.name} className="flex items-center gap-[10px]">
                <span className={cn("w-[10px] h-[10px] shrink-0", `pie-dot-${i}`)} />
                <span className="text-[13px] flex-1">{d.name}</span>
                <span className="font-display font-extrabold text-[16px]">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Barras + Top productos */}
      <div className="grid grid-cols-[1.55fr_1fr] gap-4 mb-4">
        <div className={A.panel}>
          <div className="flex justify-between items-start mb-5">
            <div>
              <div className={A.label}>Rendimiento</div>
              <div className={A.title}>Pedidos últimos 14 días</div>
            </div>
            <div className="font-display text-[22px] font-black text-right">
              +18%
              <span className="block text-[10px] font-medium tracking-[1px] uppercase text-muted">vs anterior</span>
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

        <div className={A.panel}>
          <div className="flex justify-between items-start mb-[18px]">
            <div>
              <div className={A.label}>Más vendidos</div>
              <div className={A.title}>Top productos</div>
            </div>
            {/* FASE 8: Link en vez de router.push que causaba 404 */}
            <Link
              href="/admin/products"
              className="font-display text-[14px] font-bold no-underline tracking-[1px] text-muted"
            >
              Ver todos →
            </Link>
          </div>
          <div className="flex flex-col gap-[14px]">
            {topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-[14px]">
                <span className="font-display font-black text-[18px] w-[18px] text-muted">{i + 1}</span>
                <div className={`${CAT_STRIPE[p.cat]} w-[40px] h-[40px] shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className={cn(A.rowName, "text-[15px] whitespace-nowrap overflow-hidden text-ellipsis mb-[5px]")}>{p.name}</div>
                  <div className="h-[5px] overflow-hidden bg-[var(--sub)]">
                    {/* width es dinámico (calculado en runtime) — se mantiene inline */}
                    <span className="block h-full bg-[var(--gold)]" style={{ width: `${(p.stock / maxStock) * 100}%` }} />
                  </div>
                </div>
                <div className="font-display font-black text-[18px] text-right">
                  {p.stock}
                  <span className="block text-[9px] font-medium tracking-[1px] uppercase text-muted">uds</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className={A.panel}>
        <div className="flex justify-between items-start mb-[18px]">
          <div>
            <div className={A.label}>Actividad reciente</div>
            <div className={A.title}>Últimos pedidos</div>
          </div>
          {/* FASE 8: Link en vez de router.push */}
          <Link
            href="/admin/orders"
            className="font-display text-[14px] font-bold no-underline tracking-[1px] text-muted"
          >
            Ver todos →
          </Link>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Pedido", "Cliente", "Fecha", "Total", "Estado"].map((h) => (
                <th key={h} className={A.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, 5).map((o) => (
              <tr key={o.id}>
                <td className={cn(A.td, A.monoGold)}>{o.id}</td>
                <td className={A.td}>
                  <div className={A.rowName}>{o.customer}</div>
                </td>
                <td className={cn(A.td, A.mono, "text-[13px]")}>{fmtDate(o.date)}</td>
                <td className={cn(A.td, A.valGold)}>${fmt(orderTotal(o))}</td>
                <td className={A.td}>
                  <StatusBadge config={ORDER_STATUS[o.status]} variant="filled" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
