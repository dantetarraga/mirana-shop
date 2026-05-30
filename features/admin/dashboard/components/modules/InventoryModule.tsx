"use client";

import { useState } from "react";
import { CAT_STRIPE, type Product } from "@/shared/data/products";
import { StockBadge } from "@/features/admin/dashboard/components/StockBadge";
import { S } from "@/features/admin/dashboard/lib/admin-styles";
import { Button } from "@/components/ui/Button";

export function InventoryModule({ products, onSave }: { products: Product[]; onSave: (p: Product) => void }) {
  const [filter, setFilter] = useState("todos");
  const low = products.filter(p => p.stock > 0 && p.stock <= 8);
  const out = products.filter(p => p.stock === 0);
  const totalUnits = products.reduce((s, p) => s + p.stock, 0);
  const value = products.reduce((s, p) => s + p.stock * p.price, 0);
  const list = filter === "low" ? low : filter === "out" ? out : products;

  return (
    <div style={{ padding: "28px 32px 48px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {[["Unidades totales", totalUnits, "var(--text)"], ["Valor inventario", `$${(value / 1000).toFixed(1)}K`, "var(--gold)"], ["Stock bajo", low.length, "#ffb84a"], ["Agotados", out.length, "#ff6644"]].map(([l, v, c]) => (
          <div key={String(l)} style={S.kpi}>
            <div style={{ fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--mt)", marginBottom: 8 }}>{l}</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 900, lineHeight: 1, color: c as string }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        <Button variant="tab" size="sm" active={filter === "todos"} onClick={() => setFilter("todos")}>Todos <span style={{ fontSize: 12, opacity: .7 }}>{products.length}</span></Button>
        <Button variant="tab" size="sm" active={filter === "low"}   onClick={() => setFilter("low")}>Stock bajo <span style={{ fontSize: 12, opacity: .7 }}>{low.length}</span></Button>
        <Button variant="tab" size="sm" active={filter === "out"}   onClick={() => setFilter("out")}>Agotados <span style={{ fontSize: 12, opacity: .7 }}>{out.length}</span></Button>
      </div>
      <div style={{ ...S.panel, padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Producto", "SKU", "Stock", "Valor", "Ajustar inventario"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {list.map(p => (
              <tr key={p.id}>
                <td style={S.td}><div style={{ display: "flex", alignItems: "center", gap: 12 }}><div className={CAT_STRIPE[p.cat]} style={{ width: 42, height: 42 }} /><div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, textTransform: "uppercase" }}>{p.name}</div></div></td>
                <td style={{ ...S.td, fontFamily: "monospace", fontSize: 12, color: "var(--mt)" }}>{p.sku}</td>
                <td style={S.td}><StockBadge s={p.stock} /></td>
                <td style={{ ...S.td, fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--gold)", fontSize: 16 }}>${(p.stock * p.price).toFixed(2)}</td>
                <td style={S.td}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <Button variant="icon" size="sm" onClick={() => onSave({ ...p, stock: Math.max(0, p.stock - 1) })}>−</Button>
                    <input type="number" value={p.stock} min="0" onChange={e => onSave({ ...p, stock: Math.max(0, parseInt(e.target.value) || 0) })} style={{ width: 58, textAlign: "center", background: "var(--surf)", border: "1px solid var(--bd)", color: "var(--text)", padding: 6, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15 }} />
                    <Button variant="icon" size="sm" onClick={() => onSave({ ...p, stock: p.stock + 1 })}>+</Button>
                    <Button variant="ghost" size="sm" onClick={() => onSave({ ...p, stock: p.stock + 50 })} style={{ marginLeft: 8 }}>+50</Button>
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
