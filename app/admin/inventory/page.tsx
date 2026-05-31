import { productRepo, type StockFilter } from "@/modules/catalog/repositories/product.repo";
import { inventoryRepo } from "@/modules/inventory/repositories/inventory.repo";
import { StockAdjustControl } from "@/features/inventory/components/StockAdjustControl";
import { KpiCard } from "@/shared/components/KpiCard";
import { StockBadge } from "@/shared/components/StockBadge";
import { cls } from "@/shared/lib/admin-classes";
import { cn } from "@/shared/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CATEGORY_STRIPE: Record<string, string> = {
  "figuras-accion": "stripe-fig",
  lego:             "stripe-lego",
  "modelos-escala": "stripe-veh",
  anime:            "stripe-fig",
};

const VALID_FILTERS = new Set<StockFilter>(["all", "low", "out"]);

const FILTER_TABS: { key: StockFilter; label: string; href: string }[] = [
  { key: "all", label: "Todos",      href: "/admin/inventory" },
  { key: "low", label: "Stock bajo", href: "/admin/inventory?filter=low" },
  { key: "out", label: "Agotados",   href: "/admin/inventory?filter=out" },
];

interface PageProps {
  searchParams: Promise<{ filter?: string }>;
}

// ---------------------------------------------------------------------------
// Page — 100% Server Component
// La única isla cliente es <StockAdjustControl />, que pesa ~1 KB.
// ---------------------------------------------------------------------------

export default async function InventoryPage({ searchParams }: PageProps) {
  const { filter: rawFilter } = await searchParams;
  const stockFilter: StockFilter =
    rawFilter && VALID_FILTERS.has(rawFilter as StockFilter)
      ? (rawFilter as StockFilter)
      : "all";

  const [products, stats] = await Promise.all([
    productRepo.findMany({ stockFilter, status: undefined, take: 500 }),
    inventoryRepo.getStats(),
  ]);

  return (
    <div className="px-8 pt-7 pb-12">

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KpiCard label="Unidades totales" value={stats.totalUnits}                                        valueClass="text-text" />
        <KpiCard label="Valor inventario" value={`S/ ${(stats.totalValue / 1000).toFixed(1)}K`}          valueClass="text-(--gold)" />
        <KpiCard label="Stock bajo"       value={stats.lowStockCount}                                     valueClass="text-[#ffb84a]" />
        <KpiCard label="Agotados"         value={stats.outOfStockCount}                                   valueClass="text-[#ff6644]" />
      </div>

      {/* Tabs — navegación GET, sin estado cliente */}
      <div className="flex gap-1.5 mb-5">
        {FILTER_TABS.map(({ key, label, href }) => (
          <a
            key={key}
            href={href}
            className={cn(
              "px-3.5 py-2 text-[11px] tracking-[1px] uppercase font-display font-extrabold border transition-colors",
              key === stockFilter
                ? "bg-(--gold) border-(--gold) text-black"
                : "border-(--bd) text-muted hover:text-text"
            )}
          >
            {label}
            <span className="opacity-70 ml-1.5 font-sans normal-case tracking-normal text-[12px]">
              {products.length}
            </span>
          </a>
        ))}
      </div>

      {/* Tabla — server rendered, sin useState */}
      <div className={cls.panelTable}>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Producto", "SKU", "Stock", "Valor", "Ajustar inventario"].map((h) => (
                <th key={h} className={cls.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted text-[13px]">
                  Sin productos en este filtro.
                </td>
              </tr>
            ) : products.map((p) => {
              const stock = p.inventory?.availableStock ?? 0;
              const value = stock * Number(p.price);
              const stripe = CATEGORY_STRIPE[p.category.slug] ?? "stripe-fig";

              return (
                <tr key={p.id} className="hover:bg-white/2 transition-colors">
                  <td className={cls.td}>
                    <div className="flex items-center gap-3">
                      <div className={`${stripe} w-10.5 h-10.5 shrink-0`} />
                      <div>
                        <div className={cls.rowName}>{p.name}</div>
                        <div className={cls.rowSub}>{p.brand.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className={cn(cls.td, cls.mono)}>{p.sku}</td>
                  <td className={cls.td}><StockBadge s={stock} /></td>
                  <td className={cn(cls.td, cls.valGold)}>S/ {value.toFixed(2)}</td>
                  <td className={cls.td}>
                    <StockAdjustControl
                      productId={p.id}
                      productName={p.name}
                      stock={stock}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
