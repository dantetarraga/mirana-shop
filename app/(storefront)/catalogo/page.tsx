"use client";

import { useSearchParams } from "next/navigation";
import { useState, useMemo, Suspense } from "react";
import { ProductCard } from "@/components/shared/ProductCard";
import { PRODUCTS, type ProductCategory } from "@/shared/data/products";
import { Button } from "@/components/ui/Button";
import { Search } from "lucide-react";

const FILTERS: { key: "all" | ProductCategory; label: string }[] = [
  { key: "all",      label: "Todos" },
  { key: "figures",  label: "Figuras" },
  { key: "lego",     label: "LEGO" },
  { key: "vehicles", label: "Vehículos" },
];

function CatalogContent() {
  const params = useSearchParams();
  const catParam = params.get("cat") as ProductCategory | null;
  const qParam = params.get("q") || "";

  const [filter, setFilter] = useState<"all" | ProductCategory>(catParam || "all");
  const [search, setSearch] = useState(qParam);

  const filtered = useMemo(() =>
    PRODUCTS.filter(
      (p) =>
        (filter === "all" || p.cat === filter) &&
        (search === "" || p.name.toLowerCase().includes(search.toLowerCase()))
    ),
    [filter, search]
  );

  return (
    <section style={{ padding: "calc(var(--nh) + 36px) 48px 80px" }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "var(--gold)", marginBottom: 6 }}>Tienda completa</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 6 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px,5vw,64px)", fontWeight: 900, textTransform: "uppercase", letterSpacing: -1, lineHeight: .95, margin: 0 }}>Catálogo</h1>
        <div style={{ fontSize: 13, color: "var(--mt)" }}>{filtered.length} productos</div>
      </div>

      <div style={{ height: 1, background: "var(--bd)", margin: "16px 0 24px" }} />

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28, alignItems: "center" }}>
        {FILTERS.map(({ key, label }) => (
          <Button key={key} variant="tab" size="sm" active={filter === key} onClick={() => setFilter(key)}>{label}</Button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, background: "var(--surf)", border: "1px solid var(--bd)", padding: "0 14px", height: 40 }} className="search-wrap">
          <Search size={13} style={{ color: "var(--mt)", flexShrink: 0 }} />
          <input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ background: "none", border: "none", outline: "none", color: "var(--text)", fontFamily: "var(--font-sans)", fontSize: 13, width: 160 }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--mt)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 900, textTransform: "uppercase", marginBottom: 8 }}>Sin resultados</div>
          <div style={{ fontSize: 14 }}>Prueba con otro término de búsqueda</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      <style>{`.search-wrap:focus-within { border-color: var(--gold) !important; }`}</style>
    </section>
  );
}

export default function CatalogPage() {
  return (
    <Suspense>
      <CatalogContent />
    </Suspense>
  );
}
