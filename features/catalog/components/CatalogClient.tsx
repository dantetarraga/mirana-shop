"use client";

import { useSearchParams } from "next/navigation";
import { useState, useMemo } from "react";
import { ProductCard } from "@/shared/components/ProductCard";
import { Button } from "@/shared/components/ui/Button";
import { Search } from "lucide-react";
import type { CatalogProduct } from "@/shared/types/catalog.types";
import type { CategoryRow } from "@/modules/catalog/repositories/category.repo";

interface CatalogClientProps {
  initialProducts: CatalogProduct[];
  categories: CategoryRow[];
}

export function CatalogClient({ initialProducts, categories }: CatalogClientProps) {
  const params = useSearchParams();
  const catParam = params.get("cat") ?? "";
  const qParam = params.get("q") ?? "";

  const [filter, setFilter] = useState<string>(catParam || "all");
  const [search, setSearch] = useState(qParam);

  // Tabs dinámicos desde BD
  const FILTERS = useMemo(
    () => [
      { key: "all", label: "Todos" },
      ...categories.map((c) => ({ key: c.slug, label: c.name })),
    ],
    [categories]
  );

  const filtered = useMemo(
    () =>
      initialProducts.filter(
        (p) =>
          (filter === "all" || p.category.slug === filter) &&
          (search === "" ||
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase()))
      ),
    [initialProducts, filter, search]
  );

  return (
    <section className="px-12 pb-20 pt-[calc(var(--nh)+36px)]">
      <div className="text-[10px] font-bold tracking-[3px] uppercase mb-1.5 text-(--gold)">
        Tienda completa
      </div>
      <div className="flex justify-between items-end mb-1.5">
        <h1 className="font-display font-black uppercase tracking-[-1px] m-0 leading-[0.95] text-[clamp(36px,5vw,64px)]">
          Catálogo
        </h1>
        <div className="text-[13px] text-muted">{filtered.length} productos</div>
      </div>

      <div className="h-px my-4 mb-6 bg-(--bd)" />

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap mb-7 items-center">
        {FILTERS.map(({ key, label }) => (
          <Button
            key={key}
            variant="tab"
            size="sm"
            active={filter === key}
            onClick={() => setFilter(key)}
          >
            {label}
          </Button>
        ))}
        <div className="ml-auto flex items-center gap-2 px-3.5 h-10 bg-surf border border-(--bd) transition-[border-color] duration-[.2s] focus-within:border-(--gold)">
          <Search size={13} className="shrink-0 text-muted" />
          <input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none font-sans text-[13px] w-[160px] text-text"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 px-5 text-muted">
          <div className="font-display text-[28px] font-black uppercase mb-2">
            Sin resultados
          </div>
          <div className="text-[14px]">Prueba con otro término de búsqueda</div>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
