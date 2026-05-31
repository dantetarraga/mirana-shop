"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
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
import { cls } from "@/shared/lib/admin-classes";
import { productDbSchema, type ProductDbInput } from "@/shared/lib/schemas";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  importProducts,
} from "@/features/products/actions/product.actions";
import type { ProductListItem } from "@/modules/catalog/repositories/product.repo";
import type { CategoryRow } from "@/modules/catalog/repositories/category.repo";
import type { BrandRow } from "@/modules/catalog/repositories/brand.repo";
import { FileSpreadsheet, Pencil, X } from "lucide-react";
import type { ImportProductRow } from "@/shared/lib/schemas";

// ---------------------------------------------------------------------------
// Helpers de presentación — reemplazan CAT_STRIPE y CAT_LABELS del mock
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

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Disponible",
  PREORDER: "Preventa",
  SOLD_OUT: "Agotado",
  COMING_SOON: "Próximamente",
  ARCHIVED: "Archivado",
};

// ---------------------------------------------------------------------------
// Tabs de categoría (dinámicos)
// ---------------------------------------------------------------------------

function buildTabs(categories: CategoryRow[]) {
  return [
    { key: "all", label: "Todos" },
    ...categories.map((c) => ({ key: c.slug, label: c.name })),
  ];
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ProductsClientProps {
  initialProducts: ProductListItem[];
  categories: CategoryRow[];
  brands: BrandRow[];
}

// ---------------------------------------------------------------------------
// Form defaults
// ---------------------------------------------------------------------------

const EMPTY_FORM: ProductDbInput = {
  name: "",
  slug: "",
  sku: "",
  description: "",
  price: 0,
  stock: 0,
  categoryId: "",
  brandId: "",
  status: "AVAILABLE",
  featured: false,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProductsClient({
  initialProducts,
  categories,
  brands,
}: ProductsClientProps) {
  const [products, setProducts] = useState<ProductListItem[]>(initialProducts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [isPending, startTransition] = useTransition();

  const TABS = useMemo(() => buildTabs(categories), [categories]);

  const form = useForm<ProductDbInput>({
    resolver: zodResolver(productDbSchema),
    defaultValues: EMPTY_FORM,
  });
  const { register, handleSubmit, reset, formState: { errors } } = form;

  const editingProduct = useMemo(
    () => products.find((p) => p.id === editingId) ?? null,
    [products, editingId]
  );

  useEffect(() => {
    if (editingProduct) {
      reset({
        name: editingProduct.name,
        slug: editingProduct.slug,
        sku: editingProduct.sku,
        description: editingProduct.description ?? "",
        price: Number(editingProduct.price),
        compareAtPrice: editingProduct.compareAtPrice
          ? Number(editingProduct.compareAtPrice)
          : undefined,
        stock: editingProduct.inventory?.availableStock ?? 0,
        categoryId: editingProduct.category.id,
        brandId: editingProduct.brand.id,
        status: editingProduct.status,
        featured: editingProduct.featured,
      });
    } else if (isNew) {
      reset({ ...EMPTY_FORM, categoryId: categories[0]?.id ?? "", brandId: brands[0]?.id ?? "" });
    }
  }, [editingProduct, isNew, reset, categories, brands]);

  const filtered = products.filter(
    (p) =>
      (cat === "all" || p.category.slug === cat) &&
      p.name.toLowerCase().includes(q.toLowerCase())
  );

  const openNew = () => {
    setEditingId(null);
    setIsNew(true);
  };

  const openEdit = (p: ProductListItem) => {
    setIsNew(false);
    setEditingId(p.id);
  };

  const closeDrawer = () => {
    setEditingId(null);
    setIsNew(false);
    reset(EMPTY_FORM);
  };

  const onSubmit = (data: ProductDbInput) => {
    startTransition(async () => {
      if (isNew) {
        const result = await createProduct(data);
        if (result.success) {
          toast.success("Producto creado");
          closeDrawer();
          // Recarga optimista — Next.js revalidará en background
          window.location.reload();
        } else {
          toast.error(result.error);
        }
      } else if (editingId) {
        const result = await updateProduct(editingId, data);
        if (result.success) {
          toast.success("Producto actualizado");
          // Actualización optimista local
          setProducts((prev) =>
            prev.map((p) =>
              p.id === editingId
                ? {
                    ...p,
                    name: data.name,
                    sku: data.sku,
                    slug: data.slug,
                    price: data.price as unknown as ProductListItem["price"],
                    status: data.status,
                    featured: data.featured,
                    inventory: { availableStock: data.stock },
                  }
                : p
            )
          );
          closeDrawer();
        } else {
          toast.error(result.error);
        }
      }
    });
  };

  const handleDelete = (p: ProductListItem) => {
    if (!confirm(`¿Eliminar "${p.name}"?`)) return;
    startTransition(async () => {
      const result = await deleteProduct(p.id);
      if (result.success) {
        setProducts((prev) => prev.filter((x) => x.id !== p.id));
        toast.success(`"${p.name}" eliminado`);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleImport = (rows: ImportProductRow[]) => {
    startTransition(async () => {
      const result = await importProducts(rows);
      if (result.success) {
        const { created, updated, errors } = result.data;
        toast.success(`${created} creados, ${updated} actualizados`);
        if (errors.length > 0) {
          errors.forEach((e) => toast.error(e));
        }
        setShowImport(false);
        window.location.reload();
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
            <div
              className={`${getCategoryStripe(p.category.slug)} w-10.5 h-10.5`}
            />
            <div>
              <div className={cls.rowName}>{p.name}</div>
              <div className={cls.rowSub}>{STATUS_LABELS[p.status] ?? p.status}</div>
            </div>
          </div>
        ),
      },
      { header: "SKU", className: cls.mono, render: (p) => p.sku },
      { header: "Categoría", render: (p) => p.category.name },
      { header: "Marca", render: (p) => p.brand.name },
      {
        header: "Precio",
        className: cls.valGold,
        render: (p) => `S/ ${Number(p.price).toFixed(2)}`,
      },
      {
        header: "Stock",
        render: (p) => <StockBadge s={p.inventory?.availableStock ?? 0} />,
      },
      {
        header: "Acciones",
        headerClassName: "text-right",
        className: "text-right",
        render: (p) => (
          <div className="flex gap-1.5 justify-end">
            <Button
              variant="icon"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                openEdit(p);
              }}
            >
              <Pencil size={14} />
            </Button>
            <Button
              variant="icon"
              size="sm"
              destructive
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(p);
              }}
            >
              <X size={14} />
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const drawerOpen = isNew || editingId !== null;

  return (
    <div className="px-8 pt-7 pb-12">
      <FilterBar
        query={q}
        placeholder="Buscar producto o SKU..."
        activeTab={cat}
        tabs={TABS}
        onQuery={setQ}
        onTab={setCat}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowImport(true)}
            >
              <FileSpreadsheet size={15} />
              Importar Excel
            </Button>
            <Button variant="accent" size="md" onClick={openNew}>
              + Nuevo producto
            </Button>
          </div>
        }
      />

      <AdminTable
        columns={columns}
        data={filtered}
        keyExtractor={(p) => p.id}
        onRowClick={openEdit}
      />

      {showImport && (
        <ExcelImportDrawer
          onClose={() => setShowImport(false)}
          onImport={handleImport}
        />
      )}

      {drawerOpen && (
        <AdminDrawer
          title={
            isNew
              ? "Nuevo producto"
              : (editingProduct?.name ?? "Editar producto")
          }
          sub={isNew ? "Crear producto" : "Editar producto"}
          onClose={closeDrawer}
        >
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="flex flex-col gap-4.5"
          >
            <FormField label="Nombre" error={errors.name?.message}>
              <input
                {...register("name")}
                className={cls.input}
                placeholder="Nombre del producto"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3.5">
              <FormField label="SKU" error={errors.sku?.message}>
                <input
                  {...register("sku")}
                  className={cls.input}
                  placeholder="FIG-MAR-001"
                />
              </FormField>

              <FormField label="Slug" error={errors.slug?.message}>
                <input
                  {...register("slug")}
                  className={cls.input}
                  placeholder="nombre-del-producto"
                />
              </FormField>

              <FormField label="Precio (S/)" error={errors.price?.message}>
                <input
                  {...register("price", { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className={cls.input}
                  placeholder="0.00"
                />
              </FormField>

              <FormField label="Stock" error={errors.stock?.message}>
                <input
                  {...register("stock", { valueAsNumber: true })}
                  type="number"
                  className={cls.input}
                  placeholder="0"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <FormField label="Categoría" error={errors.categoryId?.message}>
                <select {...register("categoryId")} className={cls.input}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Marca" error={errors.brandId?.message}>
                <select {...register("brandId")} className={cls.input}>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <FormField label="Estado" error={errors.status?.message}>
                <select {...register("status")} className={cls.input}>
                  <option value="AVAILABLE">Disponible</option>
                  <option value="PREORDER">Preventa</option>
                  <option value="SOLD_OUT">Agotado</option>
                  <option value="COMING_SOON">Próximamente</option>
                  <option value="ARCHIVED">Archivado</option>
                </select>
              </FormField>

              <FormField label="Destacado" error={errors.featured?.message}>
                <select
                  {...register("featured", {
                    setValueAs: (v) => v === "true" || v === true,
                  })}
                  className={cls.input}
                >
                  <option value="false">No</option>
                  <option value="true">Sí</option>
                </select>
              </FormField>
            </div>

            <FormField label="Descripción" error={errors.description?.message}>
              <textarea
                {...register("description")}
                rows={3}
                className={cn(cls.input, "resize-y")}
              />
            </FormField>

            <div className="flex gap-2.5">
              <Button
                type="submit"
                variant="accent"
                size="md"
                full
                disabled={isPending}
              >
                {isPending ? "Guardando..." : "Guardar"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                full
                onClick={closeDrawer}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </AdminDrawer>
      )}
    </div>
  );
}
