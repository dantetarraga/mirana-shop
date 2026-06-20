import { countUsers, getUsers } from "@/features/users/queries/user.queries";
import type { UserSegment } from "@/features/users/types";
import { UsersClient } from "@/features/users/components/UsersClient";
import { ServerSearchForm } from "@/shared/components/admin/ServerSearchForm";
import { cn } from "@/shared/lib/utils";

const VALID_SEGMENTS = new Set<UserSegment>(["todos", "vip", "activo", "nuevo"]);

function toSegment(v: string | undefined): UserSegment {
  return v && VALID_SEGMENTS.has(v as UserSegment) ? (v as UserSegment) : "todos";
}

const SEGMENT_TABS = [
  { key: "todos", label: "Todos" },
  { key: "vip", label: "VIP" },
  { key: "activo", label: "Activos" },
  { key: "nuevo", label: "Nuevos" },
];

function buildUrl(params: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) p.set(k, v);
  }
  const qs = p.toString();
  return qs ? `/admin/users?${qs}` : "/admin/users";
}

interface PageProps {
  searchParams: Promise<{ q?: string; segment?: string; page?: string }>;
}

const PER_PAGE = 50;

export default async function UsersPage({ searchParams }: PageProps) {
  const { q, segment: rawSegment, page: rawPage } = await searchParams;
  const segment = toSegment(rawSegment);
  const page = Math.max(1, Number(rawPage ?? 1));
  const skip = (page - 1) * PER_PAGE;

  const [users, total] = await Promise.all([
    getUsers({ search: q, segment, take: PER_PAGE, skip }),
    countUsers({ search: q, segment }),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);
  const currentQ = q ?? "";
  const currentSegment = rawSegment ?? "todos";

  return (
    <div className="px-8 pt-7 pb-12">
      {/* Filtros server-side */}
      <div className="flex items-center gap-3.5 flex-wrap mb-4">
        <ServerSearchForm
          placeholder="Buscar usuario..."
          defaultValue={currentQ}
          paramName="q"
          extraParams={currentSegment !== "todos" ? { segment: currentSegment } : {}}
        />

        <div className="flex gap-1.5">
          {SEGMENT_TABS.map(({ key, label }) => {
            const isActive = key === currentSegment;
            const href = buildUrl({
              q: currentQ || undefined,
              segment: key !== "todos" ? key : undefined,
            });
            return (
              <a
                key={key}
                href={href}
                className={cn(
                  "px-3.5 py-2 text-[11px] tracking-[1px] uppercase font-display font-extrabold border transition-colors",
                  isActive
                    ? "bg-(--gold) border-(--gold) text-black"
                    : "border-(--bd) text-muted hover:text-text",
                )}
              >
                {label}
              </a>
            );
          })}
        </div>

        {(currentQ || currentSegment !== "todos") && (
          <a
            href="/admin/users"
            className="text-[12px] text-muted hover:text-text transition-colors"
          >
            Limpiar
          </a>
        )}

        <span className="ml-auto text-[12px] text-muted">
          {total} usuario{total !== 1 ? "s" : ""}
        </span>
      </div>

      <UsersClient users={users} />

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex gap-2 justify-end mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={buildUrl({
                q: currentQ || undefined,
                segment: currentSegment !== "todos" ? currentSegment : undefined,
                page: String(p),
              })}
              className={cn(
                "px-3 py-1.5 text-[13px] border transition-colors",
                p === page
                  ? "bg-(--gold) border-(--gold) text-black font-bold"
                  : "border-(--bd) text-muted hover:text-text",
              )}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
