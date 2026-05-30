"use client";

import { useState } from "react";
import { CAT_LABELS, CAT_STRIPE, type Product } from "@/shared/data/products";
import { AdminDrawer } from "@/features/admin/dashboard/components/AdminDrawer";
import { StockBadge } from "@/features/admin/dashboard/components/StockBadge";
import { S, formInp, FormField } from "@/features/admin/dashboard/lib/admin-styles";
import { Button } from "@/components/ui/Button";

export function ProductsModule({ products, onSave, onDelete }: { products: Product[]; onSave: (p: Product) => void; onDelete: (id: number) => void }) {
  const [editing, setEditing] = useState<Product | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const list = products.filter(p => (cat === "all" || p.cat === cat) && p.name.toLowerCase().includes(q.toLowerCase()));
  const startNew = () => setEditing({ id: Math.max(0, ...products.map(p => p.id)) + 1, name: "", cat: "figures", price: 0, stock: 0, sku: "", badge: null, desc: "", rating: 4.5, reviews: 0, isNew: true });

  return (
    <div style={{ padding: "28px 32px 48px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, background: "var(--card)", border: "1px solid var(--bd)", padding: "0 14px", height: 42, flex: 1, minWidth: 200, maxWidth: 340 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: "var(--mt)" }}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
          <input placeholder="Buscar producto o SKU..." value={q} onChange={e => setQ(e.target.value)} style={{ background: "none", border: "none", outline: "none", color: "var(--text)", fontFamily: "var(--font-sans)", fontSize: 14, width: "100%" }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[["all", "Todos"], ["figures", "Figuras"], ["lego", "LEGO"], ["vehicles", "Vehículos"]].map(([k, l]) => (
            <Button key={k} variant="tab" size="sm" active={cat === k} onClick={() => setCat(k)}>{l}</Button>
          ))}
        </div>
        <Button variant="accent" size="md" onClick={startNew}>+ Nuevo producto</Button>
      </div>
      <div style={{ ...S.panel, padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Producto", "SKU", "Categoría", "Precio", "Stock", "Acciones"].map((h, i) => <th key={h} style={{ ...S.th, textAlign: i === 5 ? "right" : "left" }}>{h}</th>)}</tr></thead>
          <tbody>
            {list.map(p => (
              <tr key={p.id}>
                <td style={S.td}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className={CAT_STRIPE[p.cat]} style={{ width: 42, height: 42 }} />
                    <div>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, textTransform: "uppercase" }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: "var(--mt)", textTransform: "uppercase", letterSpacing: 1 }}>{p.badge || "Standard"}</div>
                    </div>
                  </div>
                </td>
                <td style={{ ...S.td, fontFamily: "monospace", fontSize: 12, color: "var(--mt)" }}>{p.sku}</td>
                <td style={S.td}>{CAT_LABELS[p.cat]}</td>
                <td style={{ ...S.td, fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--gold)", fontSize: 16 }}>${p.price.toFixed(2)}</td>
                <td style={S.td}><StockBadge s={p.stock} /></td>
                <td style={S.td}>
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <Button variant="icon" size="sm" onClick={() => setEditing(p)}>✎</Button>
                    <Button variant="icon" size="sm" destructive onClick={() => { if (confirm("¿Eliminar?")) onDelete(p.id); }}>×</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <AdminDrawer title={editing.name || "Producto sin nombre"} sub={products.some(p => p.id === editing.id) ? "Editar producto" : "Nuevo producto"} onClose={() => setEditing(null)}>
          <FormField label="Nombre"><input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} style={formInp} /></FormField>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <FormField label="SKU"><input value={editing.sku} onChange={e => setEditing({ ...editing, sku: e.target.value })} style={formInp} /></FormField>
            <FormField label="Categoría">
              <select value={editing.cat} onChange={e => setEditing({ ...editing, cat: e.target.value as Product["cat"] })} style={formInp}>
                <option value="figures">Figura de Acción</option>
                <option value="lego">Set LEGO</option>
                <option value="vehicles">Modelo Escala</option>
              </select>
            </FormField>
            <FormField label="Precio"><input type="number" step="0.01" value={editing.price} onChange={e => setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })} style={formInp} /></FormField>
            <FormField label="Stock"><input type="number" value={editing.stock} onChange={e => setEditing({ ...editing, stock: parseInt(e.target.value) || 0 })} style={formInp} /></FormField>
          </div>
          <FormField label="Badge (opcional)"><input placeholder="NUEVO, BESTSELLER..." value={editing.badge || ""} onChange={e => setEditing({ ...editing, badge: e.target.value || null })} style={formInp} /></FormField>
          <FormField label="Descripción"><textarea rows={3} value={editing.desc} onChange={e => setEditing({ ...editing, desc: e.target.value })} style={{ ...formInp, resize: "vertical" }} /></FormField>
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="accent" size="md" full onClick={() => { onSave(editing); setEditing(null); }}>Guardar</Button>
            <Button variant="outline" size="md" full onClick={() => setEditing(null)}>Cancelar</Button>
          </div>
        </AdminDrawer>
      )}
    </div>
  );
}
