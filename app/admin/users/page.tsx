"use client";

import { useMemo, useState } from "react";
import { cn } from "@/shared/lib/utils";
import { AdminDrawer } from "@/shared/components/AdminDrawer";
import { AdminTable, type Column } from "@/shared/components/AdminTable";
import { DrawerSection } from "@/shared/components/DrawerSection";
import { FilterBar } from "@/shared/components/FilterBar";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { A } from "@/shared/lib/admin-classes";
import { USER_STATUS, fmt } from "@/shared/lib/admin-constants";
import { USERS_DATA } from "@/shared/lib/admin-data";
import type { User } from "@/shared/types/admin-mock.types";

const TABS = [
  { key: "todos",  label: "Todos" },
  { key: "vip",    label: "VIP" },
  { key: "activo", label: "Activos" },
  { key: "nuevo",  label: "Nuevos" },
];

export default function UsersPage() {
  const [q, setQ]           = useState("");
  const [filter, setFilter] = useState("todos");
  const [detail, setDetail] = useState<User | null>(null);

  const filtered = (USERS_DATA as User[]).filter(
    (u) =>
      (filter === "todos" || u.status === filter) &&
      (u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()))
  );

  const columns = useMemo<Column<User>[]>(() => [
    { header: "Usuario", render: (u) => (
      <div className="flex items-center gap-3">
        <div className="w-9.5 h-9.5 flex items-center justify-center font-display font-black text-[14px] shrink-0 bg-card-hover border border-[var(--bd)] text-[var(--gold)]">
          {u.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div className={A.rowName}>{u.name}</div>
          <div className="text-[11px] text-muted">{u.email}</div>
        </div>
      </div>
    )},
    { header: "Pedidos",  className: A.val,     render: (u) => u.orders },
    { header: "Gastado",  className: A.valGold, render: (u) => `$${fmt(u.spent)}` },
    { header: "Desde",    className: "text-[13px] text-muted", render: (u) => new Date(u.joined).toLocaleDateString("es-PE", { year: "numeric", month: "short" }) },
    { header: "Segmento", render: (u) => <StatusBadge config={USER_STATUS[u.status]} variant="outlined" /> },
  ], []);

  return (
    <div className="px-8 pt-7 pb-12">
      <FilterBar query={q} placeholder="Buscar usuario..." activeTab={filter} tabs={TABS} onQuery={setQ} onTab={setFilter} />

      <AdminTable
        columns={columns}
        data={filtered}
        keyExtractor={(u) => u.id}
        onRowClick={setDetail}
      />

      {detail && (
        <AdminDrawer title={detail.name} sub="Perfil de cliente" onClose={() => setDetail(null)}>
          <div className="grid grid-cols-3 gap-2.5">
            {([["Pedidos", detail.orders], ["Gastado", `$${fmt(detail.spent)}`], ["Ticket", `$${fmt(detail.spent / detail.orders)}`]] as [string, string | number][]).map(([l, v]) => (
              <div key={l} className="p-[14px] text-center bg-card border border-[var(--bd)]">
                <div className="font-display text-[24px] font-black leading-none">{v}</div>
                <div className="text-[9px] tracking-[1px] uppercase mt-[5px] text-muted">{l}</div>
              </div>
            ))}
          </div>
          <DrawerSection title="Información">
            {([
              ["Email",         detail.email],
              ["Segmento",      USER_STATUS[detail.status].label],
              ["Cliente desde", new Date(detail.joined).toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })],
            ] as [string, string][]).map(([l, v]) => (
              <div key={l} className="flex justify-between text-[13px] py-1.5">
                <span className="text-muted">{l}</span>
                <span className={l === "Segmento" ? cn("font-bold", USER_STATUS[detail.status].textCls) : "text-text"}>{v}</span>
              </div>
            ))}
          </DrawerSection>
        </AdminDrawer>
      )}
    </div>
  );
}
