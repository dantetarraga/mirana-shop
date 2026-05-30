"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CAT_LABELS, CAT_STRIPE, type Product } from "@/shared/data/products";
import { AdminDrawer } from "@/features/admin/_shared/components/AdminDrawer";
import { StockBadge } from "@/features/admin/dashboard/components/StockBadge";
import { FilterBar } from "@/features/admin/_shared/components/FilterBar";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { Pencil, X } from "lucide-react";
import { useAdminStore } from "@/stores/admin.store";
import { A } from "@/features/admin/_shared/lib/admin-classes";

export function ProductsPage() {
  const products      = useAdminStore((s) => s.products);
  const saveProduct   = useAdminStore((s) => s.saveProduct);
  const deleteProduct = useAdminStore((s) => s.deleteProduct);
  const [editing, setEditing] = useState<Product | null>(null);
  const [q, setQ]             = useState("");
  const [cat, setCat]         = useState("all");

  const list = products.filter(
    (p) => (cat === "all" || p.cat === cat) && p.name.toLowerCase().includes(q.toLowerCase())
  );

  const startNew = () =>
    setEditing({
      id: Math.max(0, ...products.map((p) => p.id)) + 1,
      name: "", cat: "figures", price: 0, stock: 0, sku: "",
      badge: null, desc: "", rating: 4.5, reviews: 0, isNew: true,
    });

  const tabs = [
    { key: "all",      label: "Todos" },
    { key: "figures",  label: "Figuras" },
    { key: "lego",     label: "LEGO" },
    { key: "vehicles", label: "Vehículos" },
  ];

  return (
    <div className="px-8 pt-7 pb-12">
      <FilterBar
        query={q}
        placeholder="Buscar producto o SKU..."
        activeTab={cat}
        tabs={tabs}
        onQuery={setQ}
        onTab={setCat}
        actions={
          <Button variant="accent" size="md" onClick={startNew}>+ Nuevo producto</Button>
        }
      />

      <div className={A.panelTable}>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Producto", "SKU", "Categoría", "Precio", "Stock", "Acciones"].map((h, i) => (
                <th key={h} className={cn(A.th, i === 5 && "text-right")}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id}>
                <td className={A.td}>
                  <div className="flex items-center gap-3">
                    <div className={`${CAT_STRIPE[p.cat]} w-[42px] h-[42px]`} />
                    <div>
                      <div className={A.rowName}>{p.name}</div>
                      <div className={A.rowSub}>{p.badge || "Standard"}</div>
                    </div>
                  </div>
                </td>
                <td className={cn(A.td, A.mono)}>{p.sku}</td>
                <td className={A.td}>{CAT_LABELS[p.cat]}</td>
                <td className={cn(A.td, A.valGold)}>${p.price.toFixed(2)}</td>
                <td className={A.td}><StockBadge s={p.stock} /></td>
                <td className={A.td}>
                  <div className="flex gap-1.5 justify-end">
                    <Button variant="icon" size="sm" onClick={() => setEditing(p)}><Pencil size={14} /></Button>
                    <Button variant="icon" size="sm" destructive onClick={() => { if (confirm("¿Eliminar?")) deleteProduct(p.id); }}><X size={14} /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <AdminDrawer
          title={editing.name || "Producto sin nombre"}
          sub={products.some((p) => p.id === editing.id) ? "Editar producto" : "Nuevo producto"}
          onClose={() => setEditing(null)}
        >
          <FormField label="Nombre">
            <input
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className={A.input}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-[14px]">
            <FormField label="SKU">
              <input
                value={editing.sku}
                onChange={(e) => setEditing({ ...editing, sku: e.target.value })}
                className={A.input}
              />
            </FormField>
            <FormField label="Categoría">
              <select
                value={editing.cat}
                onChange={(e) => setEditing({ ...editing, cat: e.target.value as Product["cat"] })}
                className={A.input}
              >
                <option value="figures">Figura de Acción</option>
                <option value="lego">Set LEGO</option>
                <option value="vehicles">Modelo Escala</option>
              </select>
            </FormField>
            <FormField label="Precio">
              <input
                type="number"
                step="0.01"
                value={editing.price}
                onChange={(e) => setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })}
                className={A.input}
              />
            </FormField>
            <FormField label="Stock">
              <input
                type="number"
                value={editing.stock}
                onChange={(e) => setEditing({ ...editing, stock: parseInt(e.target.value) || 0 })}
                className={A.input}
              />
            </FormField>
          </div>
          <FormField label="Badge (opcional)">
            <input
              placeholder="NUEVO, BESTSELLER..."
              value={editing.badge || ""}
              onChange={(e) => setEditing({ ...editing, badge: e.target.value || null })}
              className={A.input}
            />
          </FormField>
          <FormField label="Descripción">
            <textarea
              rows={3}
              value={editing.desc}
              onChange={(e) => setEditing({ ...editing, desc: e.target.value })}
              className={cn(A.input, "resize-y")}
            />
          </FormField>
          <div className="flex gap-[10px]">
            <Button variant="accent" size="md" full onClick={() => { saveProduct(editing); setEditing(null); }}>Guardar</Button>
            <Button variant="outline" size="md" full onClick={() => setEditing(null)}>Cancelar</Button>
          </div>
        </AdminDrawer>
      )}
    </div>
  );
}
