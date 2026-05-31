"use client";

import { useMemo, useState } from "react";
import { AdminDrawer } from "@/shared/components/AdminDrawer";
import { AdminTable, type Column } from "@/shared/components/AdminTable";
import { DrawerSection } from "@/shared/components/DrawerSection";
import { FilterBar } from "@/shared/components/FilterBar";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { cls } from "@/shared/lib/admin-classes";
import { USER_STATUS } from "@/shared/lib/admin-constants";
import { cn } from "@/shared/lib/utils";
import type { AdminUserRow } from "@/app/admin/users/page";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type UserSegment = "vip" | "activo" | "nuevo";

function getSegment(user: AdminUserRow): UserSegment {
  const orderCount = user._count.orders;
  if (orderCount >= 10) return "vip";
  if (orderCount >= 1) return "activo";
  return "nuevo";
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  CUSTOMER: "Cliente",
};

const TABS = [
  { key: "todos", label: "Todos" },
  { key: "vip", label: "VIP" },
  { key: "activo", label: "Activos" },
  { key: "nuevo", label: "Nuevos" },
];

interface UsersClientProps {
  initialUsers: AdminUserRow[];
}

export function UsersClient({ initialUsers }: UsersClientProps) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("todos");
  const [detail, setDetail] = useState<AdminUserRow | null>(null);

  const filtered = initialUsers.filter((u) => {
    const segment = getSegment(u);
    const matchesFilter = filter === "todos" || segment === filter;
    const matchesQuery =
      !q ||
      (u.name ?? "").toLowerCase().includes(q.toLowerCase()) ||
      u.email.toLowerCase().includes(q.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  const columns = useMemo<Column<AdminUserRow>[]>(
    () => [
      {
        header: "Usuario",
        render: (u) => (
          <div className="flex items-center gap-3">
            <div className="w-9.5 h-9.5 flex items-center justify-center font-display font-black text-[14px] shrink-0 bg-card-hover border border-(--bd) text-(--gold)">
              {(u.name ?? u.email)
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <div className={cls.rowName}>{u.name ?? "Sin nombre"}</div>
              <div className="text-[11px] text-muted">{u.email}</div>
            </div>
          </div>
        ),
      },
      {
        header: "Pedidos",
        className: cls.val,
        render: (u) => u._count.orders,
      },
      {
        header: "Rol",
        render: (u) => (
          <span className="text-[13px]">{ROLE_LABELS[u.role] ?? u.role}</span>
        ),
      },
      {
        header: "Desde",
        className: "text-[13px] text-muted",
        render: (u) =>
          new Date(u.createdAt).toLocaleDateString("es-PE", {
            year: "numeric",
            month: "short",
          }),
      },
      {
        header: "Segmento",
        render: (u) => {
          const segment = getSegment(u);
          return (
            <StatusBadge
              config={USER_STATUS[segment] ?? USER_STATUS.nuevo}
              variant="outlined"
            />
          );
        },
      },
    ],
    []
  );

  return (
    <div className="px-8 pt-7 pb-12">
      <FilterBar
        query={q}
        placeholder="Buscar usuario..."
        activeTab={filter}
        tabs={TABS}
        onQuery={setQ}
        onTab={setFilter}
      />

      <AdminTable
        columns={columns}
        data={filtered}
        keyExtractor={(u) => u.id}
        onRowClick={setDetail}
      />

      {detail && (
        <AdminDrawer
          title={detail.name ?? "Usuario"}
          sub="Perfil de cliente"
          onClose={() => setDetail(null)}
        >
          <div className="grid grid-cols-2 gap-2.5">
            {(
              [
                ["Pedidos", detail._count.orders],
                ["Segmento", USER_STATUS[getSegment(detail)]?.label ?? "—"],
              ] as [string, string | number][]
            ).map(([l, v]) => (
              <div key={l} className="p-[14px] text-center bg-card border border-(--bd)">
                <div className="font-display text-[24px] font-black leading-none">{v}</div>
                <div className="text-[9px] tracking-[1px] uppercase mt-[5px] text-muted">
                  {l}
                </div>
              </div>
            ))}
          </div>

          <DrawerSection title="Información">
            {(
              [
                ["Email", detail.email],
                ["Rol", ROLE_LABELS[detail.role] ?? detail.role],
                [
                  "Cliente desde",
                  new Date(detail.createdAt).toLocaleDateString("es-PE", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  }),
                ],
                ["Segmento", USER_STATUS[getSegment(detail)]?.label ?? "—"],
              ] as [string, string][]
            ).map(([l, v]) => (
              <div key={l} className="flex justify-between text-[13px] py-1.5">
                <span className="text-muted">{l}</span>
                <span
                  className={
                    l === "Segmento"
                      ? cn(
                          "font-bold",
                          USER_STATUS[getSegment(detail)]?.textCls ?? ""
                        )
                      : "text-text"
                  }
                >
                  {v}
                </span>
              </div>
            ))}
          </DrawerSection>
        </AdminDrawer>
      )}
    </div>
  );
}
