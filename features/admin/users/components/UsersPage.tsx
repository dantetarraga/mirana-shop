"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { AdminDrawer } from "@/features/admin/_shared/components/AdminDrawer";
import type { User } from "@/features/admin/_shared/lib/admin.types";
import { USERS_DATA } from "@/features/admin/dashboard/lib/admin-data";
import { USER_STATUS, fmt } from "@/features/admin/dashboard/lib/admin-constants";
import { FilterBar } from "@/features/admin/_shared/components/FilterBar";
import { StatusBadge } from "@/features/admin/_shared/components/StatusBadge";
import { A } from "@/features/admin/_shared/lib/admin-classes";

export function UsersPage() {
  const [q, setQ]             = useState("");
  const [filter, setFilter]   = useState("todos");
  const [detail, setDetail]   = useState<User | null>(null);

  const list = (USERS_DATA as User[]).filter(
    (u) =>
      (filter === "todos" || u.status === filter) &&
      (u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()))
  );

  const tabs = [
    { key: "todos",  label: "Todos" },
    { key: "vip",    label: "VIP" },
    { key: "activo", label: "Activos" },
    { key: "nuevo",  label: "Nuevos" },
  ];

  return (
    <div className="px-8 pt-7 pb-12">
      <FilterBar
        query={q}
        placeholder="Buscar usuario..."
        activeTab={filter}
        tabs={tabs}
        onQuery={setQ}
        onTab={setFilter}
      />

      <div className={A.panelTable}>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Usuario", "Pedidos", "Gastado", "Desde", "Segmento"].map((h) => (
                <th key={h} className={A.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id} className="cursor-pointer" onClick={() => setDetail(u)}>
                <td className={A.td}>
                  <div className="flex items-center gap-3">
                    <div className="w-[38px] h-[38px] flex items-center justify-center font-display font-black text-[14px] shrink-0 bg-card-hover border border-[var(--bd)] text-[var(--gold)]">
                      {u.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className={A.rowName}>{u.name}</div>
                      <div className="text-[11px] text-muted">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className={cn(A.td, A.val)}>{u.orders}</td>
                <td className={cn(A.td, A.valGold)}>${fmt(u.spent)}</td>
                <td className={cn(A.td, "text-[13px] text-muted")}>
                  {new Date(u.joined).toLocaleDateString("es-PE", { year: "numeric", month: "short" })}
                </td>
                <td className={A.td}>
                  <StatusBadge config={USER_STATUS[u.status]} variant="outlined" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detail && (
        <AdminDrawer title={detail.name} sub="Perfil de cliente" onClose={() => setDetail(null)}>
          <div className="grid grid-cols-3 gap-[10px]">
            {([["Pedidos", detail.orders], ["Gastado", `$${fmt(detail.spent)}`], ["Ticket", `$${fmt(detail.spent / detail.orders)}`]] as [string, string | number][]).map(([l, v]) => (
              <div
                key={l}
                className="p-[14px] text-center bg-card border border-[var(--bd)]"
              >
                <div className="font-display text-[24px] font-black leading-none">{v}</div>
                <div className="text-[9px] tracking-[1px] uppercase mt-[5px] text-muted">{l}</div>
              </div>
            ))}
          </div>
          <div className="pt-[18px] border-t border-[var(--bd)]">
            <div className={cn(A.label, "mb-[10px]")}>Información</div>
            {([
              ["Email",         detail.email],
              ["Segmento",      USER_STATUS[detail.status].label],
              ["Cliente desde", new Date(detail.joined).toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })],
            ] as [string, string][]).map(([l, v]) => (
              <div key={l} className="flex justify-between text-[13px] py-1.5">
                <span className="text-muted">{l}</span>
                <span
                  className={l === "Segmento"
                    ? cn("font-bold", USER_STATUS[detail.status].textCls)
                    : "text-text"
                  }
                >
                  {v}
                </span>
              </div>
            ))}
          </div>
        </AdminDrawer>
      )}
    </div>
  );
}
