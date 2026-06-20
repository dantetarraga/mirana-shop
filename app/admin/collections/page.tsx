import { countCollections, getCollections } from "@/features/collections/queries/collection.queries";
import { CollectionsTableClient } from "@/features/collections/components/CollectionsTableClient";
import { ServerSearchForm } from "@/shared/components/admin/ServerSearchForm";

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string; active?: string }>;
}

export const metadata = { title: "Colecciones — Admin Mirana" };

export default async function CollectionsPage({ searchParams }: PageProps) {
  const { q, page, active: activeParam } = await searchParams;
  const currentPage = Math.max(1, Number(page ?? 1));
  const perPage = 30;

  // Filtro por estado activo: undefined = todos, "1" = activas, "0" = inactivas
  const activeFilter =
    activeParam === "1" ? true : activeParam === "0" ? false : undefined;

  const [collections, total] = await Promise.all([
    getCollections({ search: q, active: activeFilter, page: currentPage, perPage }),
    countCollections({ search: q, active: activeFilter }),
  ]);

  const totalPages = Math.ceil(total / perPage);

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { q, active: activeParam, page: String(currentPage), ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v !== undefined && v !== "") params.set(k, v);
    }
    return `/admin/collections?${params.toString()}`;
  };

  return (
    <div>
      {/* Controles de búsqueda y filtros server-side */}
      <div className="px-8 pt-6 flex items-center gap-3.5 flex-wrap mb-0">
        <ServerSearchForm
          placeholder="Buscar colecciones..."
          defaultValue={q ?? ""}
          paramName="q"
          extraParams={activeParam ? { active: activeParam } : {}}
        />

        {/* Filtro de estado por tabs GET */}
        <div className="flex gap-1.5">
          {[
            { label: "Todas", value: undefined },
            { label: "Activas", value: "1" },
            { label: "Inactivas", value: "0" },
          ].map(({ label, value }) => {
            const isActive = activeParam === value || (value === undefined && !activeParam);
            return (
              <a
                key={label}
                href={buildHref({ active: value, page: "1" })}
                className={`px-3.5 py-2 text-[11px] tracking-[1px] uppercase font-display font-extrabold border transition-colors ${
                  isActive
                    ? "bg-(--gold) border-(--gold) text-black"
                    : "border-(--bd) text-muted hover:text-text"
                }`}
              >
                {label}
              </a>
            );
          })}
        </div>

        {(q || activeParam) && (
          <a
            href="/admin/collections"
            className="text-[12px] text-muted hover:text-text transition-colors"
          >
            Limpiar filtros
          </a>
        )}
      </div>

      <CollectionsTableClient collections={collections} total={total} />

      {/* Paginación server-side */}
      {totalPages > 1 && (
        <div className="px-8 pb-8 flex items-center gap-2 justify-end">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={buildHref({ page: String(p) })}
              className={`px-3 py-1.5 text-[13px] border transition-colors ${
                p === currentPage
                  ? "bg-(--gold) border-(--gold) text-black font-bold"
                  : "border-(--bd) text-muted hover:text-text"
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
