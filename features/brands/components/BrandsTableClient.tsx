"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { AdminTable, type Column } from "@/shared/components/AdminTable";
import { Button } from "@/shared/components/ui/Button";
import { PanelHeader } from "@/shared/components/PanelHeader";
import { BrandCrudDrawer } from "@/features/brands/components/BrandCrudDrawer";
import { EntityProductsDrawer } from "@/shared/components/EntityProductsDrawer";
import { deleteBrand } from "@/features/brands/actions/brand.actions";
import { cls } from "@/shared/lib/admin-classes";
import type { BrandRow } from "@/modules/catalog/repositories/brand.repo";

interface BrandsTableClientProps {
  brands: BrandRow[];
  total: number;
  allBrands: BrandRow[];
}

export function BrandsTableClient({ brands, total, allBrands }: BrandsTableClientProps) {
  const [editingBrand, setEditingBrand] = useState<BrandRow | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [isPending, startTransition] = useTransition();

  const drawerOpen = isNew || editingBrand !== null;

  const closeDrawer = () => {
    setEditingBrand(null);
    setIsNew(false);
  };

  const handleDelete = (brand: BrandRow) => {
    if (!confirm(`¿Eliminar la marca "${brand.name}"?`)) return;
    startTransition(async () => {
      const result = await deleteBrand(brand.id);
      if (result.success) {
        toast.success(`"${brand.name}" eliminada`);
        window.location.reload();
      } else {
        toast.error(result.error);
      }
    });
  };

  const columns: Column<BrandRow>[] = [
    {
      header: "Marca",
      render: (b) => (
        <div className="flex items-center gap-3">
          {b.imageUrl ? (
            <img
              src={b.imageUrl}
              alt={b.name}
              className="w-8 h-8 object-cover shrink-0 border border-(--bd)"
            />
          ) : (
            <div className="w-8 h-8 shrink-0 bg-surf border border-(--bd) flex items-center justify-center text-[10px] text-muted font-display font-black">
              {b.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div className={cls.rowName}>{b.name}</div>
            <div className={cls.rowSub}>{b.slug}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Descripción",
      render: (b) => (
        <span className="text-[13px] text-muted line-clamp-1 max-w-xs">
          {b.description ?? "—"}
        </span>
      ),
    },
    {
      header: "Productos",
      headerClassName: "text-right",
      className: "text-right",
      render: (b) => (
        <span className={cls.val}>{b.productCount}</span>
      ),
    },
    {
      header: "Acciones",
      headerClassName: "text-right",
      className: "text-right",
      render: (b) => (
        <div className="flex gap-1.5 justify-end">
          <Button
            variant="icon"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setIsNew(false); setEditingBrand(b); }}
            title="Editar"
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="icon"
            size="sm"
            destructive
            disabled={isPending}
            onClick={(e) => { e.stopPropagation(); handleDelete(b); }}
            title="Eliminar"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="px-8 pt-7 pb-12">
      <PanelHeader
        label="Catálogo"
        title={`${total} marca${total !== 1 ? "s" : ""}`}
        align="center"
        side={
          <Button
            variant="accent"
            size="md"
            onClick={() => { setEditingBrand(null); setIsNew(true); }}
          >
            <Plus size={15} className="mr-2" /> Nueva marca
          </Button>
        }
      />

      {brands.length === 0 ? (
        <div className="text-center py-16 text-muted text-sm">
          No se encontraron marcas.
        </div>
      ) : (
        <AdminTable
          columns={columns}
          data={brands}
          keyExtractor={(b) => b.id}
          onRowClick={(b) => { setEditingBrand(null); setViewingId(b.id); }}
        />
      )}

      {drawerOpen && (
        <BrandCrudDrawer
          brand={editingBrand}
          isNew={isNew}
          onClose={closeDrawer}
        />
      )}

      {viewingId && (
        <EntityProductsDrawer
          entityId={viewingId}
          entityName={brands.find((b) => b.id === viewingId)?.name ?? ""}
          entityType="brand"
          allBrands={allBrands.map((b) => ({ id: b.id, name: b.name }))}
          onClose={() => setViewingId(null)}
        />
      )}
    </div>
  );
}
