"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { AdminDrawer } from "@/shared/components/AdminDrawer";
import { AdminTable, type Column } from "@/shared/components/AdminTable";
import { ExcelImportDrawer } from "@/shared/components/ExcelImportDrawer";
import { FilterBar } from "@/shared/components/FilterBar";
import { StockBadge } from "@/shared/components/StockBadge";
import { Button } from "@/shared/components/ui/Button";
import { FormField } from "@/shared/components/ui/FormField";
import { CAT_LABELS, CAT_STRIPE, type Product } from "@/features/products/data/products";
import { productSchema, type ProductInput } from "@/shared/lib/schemas";
import { cls } from "@/shared/lib/admin-classes";
import { useAdminStore } from "@/shared/stores/admin.store";
import { FileSpreadsheet, Pencil, X } from "lucide-react";

const TABS = [
  { key: "all",      label: "Todos" },
  { key: "figures",  label: "Figuras" },
  { key: "lego",     label: "LEGO" },
  { key: "vehicles", label: "Vehículos" },
];

export default function ProductsPage() {
  const products       = useAdminStore((s) => s.products);
  const saveProduct    = useAdminStore((s) => s.saveProduct);
  const deleteProduct  = useAdminStore((s) => s.deleteProduct);
  const importProducts = useAdminStore((s) => s.importProducts);

  // Solo identidad del producto en edición — el form tiene los valores
  const [editing,    setEditing]    = useState<Product | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [q,  setQ]  = useState("");
  const [cat, setCat] = useState("all");

  const form = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
  });
  const { register, handleSubmit, reset, formState: { errors } } = form;

  // Poblar el form cuando se selecciona un producto
  useEffect(() => {
    if (editing) reset({
      name:  editing.name,
      sku:   editing.sku,
      cat:   editing.cat,
      price: editing.price,
      stock: editing.stock,
      brand: editing.brand ?? "",
      badge: editing.badge ?? "",
      desc:  editing.desc,
    });
  }, [editing, reset]);

  const filtered = products.filter(
    (p) => (cat === "all" || p.cat === cat) && p.name.toLowerCase().includes(q.toLowerCase())
  );

  const openNew = () => {
    const id = Math.max(0, ...products.map((p) => p.id)) + 1;
    setEditing({ id, name: "", cat: "figures", price: 0, stock: 0, sku: "", badge: null, desc: "", rating: 4.5, reviews: 0, isNew: true });
  };

  const onSubmit = (data: ProductInput) => {
    const isNew = !products.some((p) => p.id === editing!.id);
    saveProduct({
      ...editing!,
      ...data,
      badge: data.badge || null,
    });
    toast.success(isNew ? "Producto creado" : "Producto actualizado");
    setEditing(null);
  };

  const handleDelete = (p: Product) => {
    deleteProduct(p.id);
    toast.success(`"${p.name}" eliminado`);
  };

  const handleImport = (items: Parameters<typeof importProducts>[0]) => {
    importProducts(items);
    toast.success(`${items.length} producto${items.length !== 1 ? "s" : ""} importado${items.length !== 1 ? "s" : ""}`);
  };

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
    { header: "Precio",    className: cls.valGold, render: (p) => `S/ ${p.price.toFixed(2)}` },
    { header: "Stock",     render: (p) => <StockBadge s={p.stock} /> },
    { header: "Acciones",  headerClassName: "text-right", className: "text-right",
      render: (p) => (
        <div className="flex gap-1.5 justify-end">
          <Button variant="icon" size="sm" onClick={(e) => { e.stopPropagation(); setEditing(p); }}>
            <Pencil size={14} />
          </Button>
          <Button variant="icon" size="sm" destructive onClick={(e) => { e.stopPropagation(); if (confirm("¿Eliminar?")) handleDelete(p); }}>
            <X size={14} />
          </Button>
        </div>
      )
    },
  ], []);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="px-8 pt-7 pb-12">
      <FilterBar
        query={q} placeholder="Buscar producto o SKU..." activeTab={cat} tabs={TABS} onQuery={setQ} onTab={setCat}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="md" onClick={() => setShowImport(true)}>
              <FileSpreadsheet size={15} />
              Importar Excel
            </Button>
            <Button variant="accent" size="md" onClick={openNew}>+ Nuevo producto</Button>
          </div>
        }
      />

      <AdminTable columns={columns} data={filtered} keyExtractor={(p) => p.id} />

      {showImport && (
        <ExcelImportDrawer onClose={() => setShowImport(false)} onImport={handleImport} />
      )}

      {editing && (
        <AdminDrawer
          title={editing.name || "Producto sin nombre"}
          sub={products.some((p) => p.id === editing.id) ? "Editar producto" : "Nuevo producto"}
          onClose={() => setEditing(null)}
        >
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4.5">
            <FormField label="Nombre" error={errors.name?.message}>
              <input {...register("name")} className={cls.input} placeholder="Nombre del producto" />
            </FormField>

            <div className="grid grid-cols-2 gap-3.5">
              <FormField label="SKU" error={errors.sku?.message}>
                <input {...register("sku")} className={cls.input} placeholder="FIG-MAR-001" />
              </FormField>

              <FormField label="Categoría" error={errors.cat?.message}>
                <select {...register("cat")} className={cls.input}>
                  <option value="figures">Figura de Acción</option>
                  <option value="lego">Set LEGO</option>
                  <option value="vehicles">Modelo Escala</option>
                </select>
              </FormField>

              <FormField label="Precio (S/)" error={errors.price?.message}>
                <input {...register("price", { valueAsNumber: true })} type="number" step="0.01" className={cls.input} placeholder="0.00" />
              </FormField>

              <FormField label="Stock" error={errors.stock?.message}>
                <input {...register("stock", { valueAsNumber: true })} type="number" className={cls.input} placeholder="0" />
              </FormField>
            </div>

            <FormField label="Marca" error={errors.brand?.message}>
              <input {...register("brand")} className={cls.input} placeholder="Hasbro, LEGO, Bandai..." />
            </FormField>

            <FormField label="Badge (opcional)" error={errors.badge?.message}>
              <input {...register("badge")} className={cls.input} placeholder="NUEVO, BESTSELLER..." />
            </FormField>

            <FormField label="Descripción" error={errors.desc?.message}>
              <textarea {...register("desc")} rows={3} className={cn(cls.input, "resize-y")} />
            </FormField>

            <div className="flex gap-2.5">
              <Button type="submit" variant="accent" size="md" full>Guardar</Button>
              <Button type="button" variant="outline" size="md" full onClick={() => setEditing(null)}>Cancelar</Button>
            </div>
          </form>
        </AdminDrawer>
      )}
    </div>
  );
}
