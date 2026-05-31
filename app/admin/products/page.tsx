"use client";

import { useMemo, useState } from "react";
import { cn } from "@/shared/lib/utils";
import { AdminDrawer } from "@/shared/components/AdminDrawer";
import { AdminTable, type Column } from "@/shared/components/AdminTable";
import { FilterBar } from "@/shared/components/FilterBar";
import { StockBadge } from "@/shared/components/StockBadge";
import { Button } from "@/shared/components/ui/Button";
import { FormField } from "@/shared/components/ui/FormField";
import { CAT_LABELS, CAT_STRIPE, type Product } from "@/features/products/data/products";
import { cls } from "@/shared/lib/admin-classes";
import { useAdminStore } from "@/shared/stores/admin.store";
import { Pencil, X } from "lucide-react";

const TABS = [
  { key: "all",      label: "Todos" },
  { key: "figures",  label: "Figuras" },
  { key: "lego",     label: "LEGO" },
  { key: "vehicles", label: "Vehículos" },
];

export default function ProductsPage() {
  const products      = useAdminStore((s) => s.products);
  const saveProduct   = useAdminStore((s) => s.saveProduct);
  const deleteProduct = useAdminStore((s) => s.deleteProduct);
  const [editing, setEditing] = useState<Product | null>(null);
  const [q, setQ]             = useState("");
  const [cat, setCat]         = useState("all");

  const filtered = products.filter(
    (p) => (cat === "all" || p.cat === cat) && p.name.toLowerCase().includes(q.toLowerCase())
  );

  const startNew = () =>
    setEditing({ id: Math.max(0, ...products.map((p) => p.id)) + 1, name: "", cat: "figures", price: 0, stock: 0, sku: "", badge: null, desc: "", rating: 4.5, reviews: 0, isNew: true });

  const columns = useMemo<Column<Product>[]>(() => [
    { header: "Producto", render: (p) => (
      <div className="flex items-center gap-3">
        <div className={`${CAT_STRIPE[p.cat]} w-10.5 h-10.5`} />
        <div>
          <div className={cls.rowName}>{p.name}</div>
          <div className={cls.rowSub}>{p.badge || "Standard"}</div>
        </div>
      </div>
    )},
    { header: "SKU",       className: cls.mono,    render: (p) => p.sku },
    { header: "Categoría", render: (p) => CAT_LABELS[p.cat] },
    { header: "Precio",    className: cls.valGold, render: (p) => `$${p.price.toFixed(2)}` },
    { header: "Stock",     render: (p) => <StockBadge s={p.stock} /> },
    { header: "Acciones",  headerClassName: "text-right", className: "text-right",
      render: (p) => (
        <div className="flex gap-1.5 justify-end">
          <Button variant="icon" size="sm" onClick={(e) => { e.stopPropagation(); setEditing(p); }}>
            <Pencil size={14} />
          </Button>
          <Button variant="icon" size="sm" destructive onClick={(e) => { e.stopPropagation(); if (confirm("¿Eliminar?")) deleteProduct(p.id); }}>
            <X size={14} />
          </Button>
        </div>
      )
    },
  ], [setEditing, deleteProduct]);

  return (
    <div className="px-8 pt-7 pb-12">
      <FilterBar
        query={q} placeholder="Buscar producto o SKU..." activeTab={cat} tabs={TABS} onQuery={setQ} onTab={setCat}
        actions={<Button variant="accent" size="md" onClick={startNew}>+ Nuevo producto</Button>}
      />

      <AdminTable
        columns={columns}
        data={filtered}
        keyExtractor={(p) => p.id}
      />

      {editing && (
        <AdminDrawer
          title={editing.name || "Producto sin nombre"}
          sub={products.some((p) => p.id === editing.id) ? "Editar producto" : "Nuevo producto"}
          onClose={() => setEditing(null)}
        >
          <FormField label="Nombre">
            <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={cls.input} />
          </FormField>
          <div className="grid grid-cols-2 gap-3.5">
            <FormField label="SKU">
              <input value={editing.sku} onChange={(e) => setEditing({ ...editing, sku: e.target.value })} className={cls.input} />
            </FormField>
            <FormField label="Categoría">
              <select value={editing.cat} onChange={(e) => setEditing({ ...editing, cat: e.target.value as Product["cat"] })} className={cls.input}>
                <option value="figures">Figura de Acción</option>
                <option value="lego">Set LEGO</option>
                <option value="vehicles">Modelo Escala</option>
              </select>
            </FormField>
            <FormField label="Precio">
              <input type="number" step="0.01" value={editing.price} onChange={(e) => setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })} className={cls.input} />
            </FormField>
            <FormField label="Stock">
              <input type="number" value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: parseInt(e.target.value) || 0 })} className={cls.input} />
            </FormField>
          </div>
          <FormField label="Badge (opcional)">
            <input placeholder="NUEVO, BESTSELLER..." value={editing.badge || ""} onChange={(e) => setEditing({ ...editing, badge: e.target.value || null })} className={cls.input} />
          </FormField>
          <FormField label="Descripción">
            <textarea rows={3} value={editing.desc} onChange={(e) => setEditing({ ...editing, desc: e.target.value })} className={cn(cls.input, "resize-y")} />
          </FormField>
          <div className="flex gap-2.5">
            <Button variant="accent" size="md" full onClick={() => { saveProduct(editing); setEditing(null); }}>Guardar</Button>
            <Button variant="outline" size="md" full onClick={() => setEditing(null)}>Cancelar</Button>
          </div>
        </AdminDrawer>
      )}
    </div>
  );
}
