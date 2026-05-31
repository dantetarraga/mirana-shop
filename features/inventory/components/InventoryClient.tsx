"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { AdminTable, type Column } from "@/shared/components/AdminTable";
import { KpiCard } from "@/shared/components/KpiCard";
import { StockBadge } from "@/shared/components/StockBadge";
import { Button } from "@/shared/components/ui/Button";
import { cls } from "@/shared/lib/admin-classes";
import { cn } from "@/shared/lib/utils";
import { adjustStock } from "@/features/inventory/actions/inventory.actions";
import type { ProductListItem } from "@/modules/catalog/repositories/product.repo";
import { Minus, Plus } from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers de presentación
// ---------------------------------------------------------------------------

function getCategoryStripe(slug: string): string {
  const map: Record<string, string> = {
    "figuras-accion": "stripe-fig",
    lego: "stripe-lego",
    "modelos-escala": "stripe-veh",
    anime: "stripe-fig",
  };
  return map[slug] ?? "stripe-fig";
}

interface InventoryStats {
  totalUnits: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
}

interface InventoryClientProps {
  initialProducts: ProductListItem[];
  initialStats: InventoryStats;
}

const LOW_STOCK_THRESHOLD = 8;

export function InventoryClient({ initialProducts, initialStats }: InventoryClientProps) {
  const [products, setProducts] = useState<ProductListItem[]>(initialProducts);
  const [filter, setFilter] = useState("todos");
  const [isPending, startTransition] = useTransition();

  const low = products.filter(
    (p) =>
      (p.inventory?.availableStock ?? 0) > 0 &&
      (p.inventory?.availableStock ?? 0) <= LOW_STOCK_THRESHOLD
  );
  const out = products.filter((p) => (p.inventory?.availableStock ?? 0) === 0);
  const list = filter === "low" ? low : filter === "out" ? out : products;

  const totalUnits = products.reduce(
    (s, p) => s + (p.inventory?.availableStock ?? 0),
    0
  );

  const adjust = (p: ProductListItem, next: number) => {
    if (next < 0) return;
    startTransition(async () => {
      const result = await adjustStock({ productId: p.id, newStock: next });
      if (result.success) {
        setProducts((prev) =>
          prev.map((x) =>
            x.id === p.id
              ? { ...x, inventory: { availableStock: result.data.newStock } }
              : x
          )
        );
        toast.success(`Stock de "${p.name}" → ${next}`);
      } else {
        toast.error(result.error);
      }
    });
  };

  const columns = useMemo<Column<ProductListItem>[]>(
    () => [
      {
        header: "Producto",
        render: (p) => (
          <div className="flex items-center gap-3">
            <div className={`${getCategoryStripe(p.category.slug)} w-10.5 h-10.5`} />
            <div>
              <div className={cls.rowName}>{p.name}</div>
              <div className={cls.rowSub}>{p.brand.name}</div>
            </div>
          </div>
        ),
      },
      { header: "SKU", className: cls.mono, render: (p) => p.sku },
      {
        header: "Stock",
        render: (p) => <StockBadge s={p.inventory?.availableStock ?? 0} />,
      },
      {
        header: "Valor",
        className: cls.valGold,
        render: (p) =>
          `S/ ${((p.inventory?.availableStock ?? 0) * Number(p.price)).toFixed(2)}`,
      },
      {
        header: "Ajustar inventario",
        render: (p) => {
          const stock = p.inventory?.availableStock ?? 0;
          return (
            <div className="flex gap-1.5 items-center">
              <Button
                variant="icon"
                size="sm"
                onClick={() => adjust(p, Math.max(0, stock - 1))}
                disabled={isPending}
              >
                <Minus size={14} />
              </Button>
              <input
                type="number"
                value={stock}
                min="0"
                onChange={(e) => adjust(p, Math.max(0, parseInt(e.target.value) || 0))}
                className="w-14.5 text-center font-display font-extrabold text-[15px] p-1.5 bg-surf border border-(--bd) text-text"
                disabled={isPending}
              />
              <Button
                variant="icon"
                size="sm"
                onClick={() => adjust(p, stock + 1)}
                disabled={isPending}
              >
                <Plus size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => adjust(p, stock + 50)}
                className="ml-2"
                disabled={isPending}
              >
                +50
              </Button>
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isPending]
  );

  return (
    <div className="px-8 pt-7 pb-12">
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KpiCard label="Unidades totales" value={totalUnits} valueClass="text-text" />
        <KpiCard
          label="Valor inventario"
          value={`S/ ${(initialStats.totalValue / 1000).toFixed(1)}K`}
          valueClass="text-(--gold)"
        />
        <KpiCard
          label="Stock bajo"
          value={low.length}
          valueClass="text-[#ffb84a]"
        />
        <KpiCard
          label="Agotados"
          value={out.length}
          valueClass="text-[#ff6644]"
        />
      </div>

      <div className="flex gap-1.5 mb-5">
        <Button
          variant="tab"
          size="sm"
          active={filter === "todos"}
          onClick={() => setFilter("todos")}
        >
          Todos{" "}
          <span className={cn("text-[12px] opacity-70")}>{products.length}</span>
        </Button>
        <Button
          variant="tab"
          size="sm"
          active={filter === "low"}
          onClick={() => setFilter("low")}
        >
          Stock bajo{" "}
          <span className={cn("text-[12px] opacity-70")}>{low.length}</span>
        </Button>
        <Button
          variant="tab"
          size="sm"
          active={filter === "out"}
          onClick={() => setFilter("out")}
        >
          Agotados{" "}
          <span className={cn("text-[12px] opacity-70")}>{out.length}</span>
        </Button>
      </div>

      <AdminTable columns={columns} data={list} keyExtractor={(p) => p.id} />
    </div>
  );
}
