"use client";

import { useMemo, useState } from "react";
import { cn } from "@/shared/lib/utils";
import { AdminTable, type Column } from "@/shared/components/AdminTable";
import { KpiCard } from "@/shared/components/KpiCard";
import { StockBadge } from "@/shared/components/StockBadge";
import { Button } from "@/shared/components/ui/Button";
import { CAT_STRIPE, type Product } from "@/features/products/data/products";
import { cls } from "@/shared/lib/admin-classes";
import { useAdminStore } from "@/shared/stores/admin.store";
import { Minus, Plus } from "lucide-react";

export default function InventoryPage() {
  const products    = useAdminStore((s) => s.products);
  const saveProduct = useAdminStore((s) => s.saveProduct);
  const [filter, setFilter] = useState("todos");

  const low        = products.filter((p) => p.stock > 0 && p.stock <= 8);
  const out        = products.filter((p) => p.stock === 0);
  const totalUnits = products.reduce((s, p) => s + p.stock, 0);
  const value      = products.reduce((s, p) => s + p.stock * p.price, 0);
  const list       = filter === "low" ? low : filter === "out" ? out : products;

  const columns = useMemo<Column<Product>[]>(() => [
    { header: "Producto", render: (p) => (
      <div className="flex items-center gap-3">
        <div className={`${CAT_STRIPE[p.cat]} w-10.5 h-10.5`} />
        <div className={cls.rowName}>{p.name}</div>
      </div>
    )},
    { header: "SKU",   className: cls.mono,    render: (p) => p.sku },
    { header: "Stock", render: (p) => <StockBadge s={p.stock} /> },
    { header: "Valor", className: cls.valGold, render: (p) => `$${(p.stock * p.price).toFixed(2)}` },
    { header: "Ajustar inventario", render: (p) => (
      <div className="flex gap-1.5 items-center">
        <Button variant="icon" size="sm" onClick={() => saveProduct({ ...p, stock: Math.max(0, p.stock - 1) })}><Minus size={14} /></Button>
        <input
          type="number" value={p.stock} min="0"
          onChange={(e) => saveProduct({ ...p, stock: Math.max(0, parseInt(e.target.value) || 0) })}
          className="w-[58px] text-center font-display font-extrabold text-[15px] p-1.5 bg-surf border border-(--bd) text-text"
        />
        <Button variant="icon" size="sm" onClick={() => saveProduct({ ...p, stock: p.stock + 1 })}><Plus size={14} /></Button>
        <Button variant="ghost" size="sm" onClick={() => saveProduct({ ...p, stock: p.stock + 50 })} className="ml-2">+50</Button>
      </div>
    )},
  ], [saveProduct]);

  return (
    <div className="px-8 pt-7 pb-12">
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KpiCard label="Unidades totales"  value={totalUnits}                       valueClass="text-text" />
        <KpiCard label="Valor inventario"  value={`$${(value / 1000).toFixed(1)}K`} valueClass="text-(--gold)" />
        <KpiCard label="Stock bajo"        value={low.length}                       valueClass="text-[#ffb84a]" />
        <KpiCard label="Agotados"          value={out.length}                       valueClass="text-[#ff6644]" />
      </div>

      <div className="flex gap-1.5 mb-5">
        <Button variant="tab" size="sm" active={filter === "todos"} onClick={() => setFilter("todos")}>
          Todos <span className={cn("text-[12px] opacity-70")}>{products.length}</span>
        </Button>
        <Button variant="tab" size="sm" active={filter === "low"} onClick={() => setFilter("low")}>
          Stock bajo <span className={cn("text-[12px] opacity-70")}>{low.length}</span>
        </Button>
        <Button variant="tab" size="sm" active={filter === "out"} onClick={() => setFilter("out")}>
          Agotados <span className={cn("text-[12px] opacity-70")}>{out.length}</span>
        </Button>
      </div>

      <AdminTable
        columns={columns}
        data={list}
        keyExtractor={(p) => p.id}
      />
    </div>
  );
}
