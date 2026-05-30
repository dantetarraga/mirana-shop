"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CAT_STRIPE } from "@/shared/data/products";
import { StockBadge } from "@/features/admin/dashboard/components/StockBadge";
import { KpiCard } from "@/features/admin/_shared/components/KpiCard";
import { Button } from "@/components/ui/Button";
import { Minus, Plus } from "lucide-react";
import { useAdminStore } from "@/stores/admin.store";
import { A } from "@/features/admin/_shared/lib/admin-classes";

export function InventoryPage() {
  const products    = useAdminStore((s) => s.products);
  const saveProduct = useAdminStore((s) => s.saveProduct);
  const [filter, setFilter] = useState("todos");

  const low  = products.filter((p) => p.stock > 0 && p.stock <= 8);
  const out  = products.filter((p) => p.stock === 0);
  const totalUnits = products.reduce((s, p) => s + p.stock, 0);
  const value      = products.reduce((s, p) => s + p.stock * p.price, 0);
  const list = filter === "low" ? low : filter === "out" ? out : products;

  return (
    <div className="px-8 pt-7 pb-12">
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KpiCard label="Unidades totales"  value={totalUnits}                       valueClass="text-text" />
        <KpiCard label="Valor inventario"  value={`$${(value / 1000).toFixed(1)}K`} valueClass="text-[var(--gold)]" />
        <KpiCard label="Stock bajo"        value={low.length}                       valueClass="text-[#ffb84a]" />
        <KpiCard label="Agotados"          value={out.length}                       valueClass="text-[#ff6644]" />
      </div>

      <div className="flex gap-1.5 mb-5">
        <Button variant="tab" size="sm" active={filter === "todos"} onClick={() => setFilter("todos")}>
          Todos <span className="text-[12px] opacity-70">{products.length}</span>
        </Button>
        <Button variant="tab" size="sm" active={filter === "low"} onClick={() => setFilter("low")}>
          Stock bajo <span className="text-[12px] opacity-70">{low.length}</span>
        </Button>
        <Button variant="tab" size="sm" active={filter === "out"} onClick={() => setFilter("out")}>
          Agotados <span className="text-[12px] opacity-70">{out.length}</span>
        </Button>
      </div>

      <div className={A.panelTable}>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Producto", "SKU", "Stock", "Valor", "Ajustar inventario"].map((h) => (
                <th key={h} className={A.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id}>
                <td className={A.td}>
                  <div className="flex items-center gap-3">
                    <div className={`${CAT_STRIPE[p.cat]} w-[42px] h-[42px]`} />
                    <div className={A.rowName}>{p.name}</div>
                  </div>
                </td>
                <td className={cn(A.td, A.mono)}>{p.sku}</td>
                <td className={A.td}><StockBadge s={p.stock} /></td>
                <td className={cn(A.td, A.valGold)}>${(p.stock * p.price).toFixed(2)}</td>
                <td className={A.td}>
                  <div className="flex gap-1.5 items-center">
                    <Button variant="icon" size="sm" onClick={() => saveProduct({ ...p, stock: Math.max(0, p.stock - 1) })}>
                      <Minus size={14} />
                    </Button>
                    <input
                      type="number"
                      value={p.stock}
                      min="0"
                      onChange={(e) => saveProduct({ ...p, stock: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-[58px] text-center font-display font-extrabold text-[15px] p-1.5 bg-surf border border-[var(--bd)] text-text"
                    />
                    <Button variant="icon" size="sm" onClick={() => saveProduct({ ...p, stock: p.stock + 1 })}>
                      <Plus size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => saveProduct({ ...p, stock: p.stock + 50 })} className="ml-2">
                      +50
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
