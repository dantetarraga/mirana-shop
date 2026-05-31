"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { AdminTable, type Column } from "@/shared/components/AdminTable";
import { Button } from "@/shared/components/ui/Button";
import { PanelHeader } from "@/shared/components/PanelHeader";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { CollectionCrudDrawer } from "@/features/collections/components/CollectionCrudDrawer";
import { EntityProductsDrawer } from "@/shared/components/EntityProductsDrawer";
import { deleteCollection } from "@/features/collections/actions/collection.actions";
import { cls } from "@/shared/lib/admin-classes";
import type { CollectionRow } from "@/modules/catalog/repositories/collection.repo";

interface CollectionsTableClientProps {
  collections: CollectionRow[];
  total: number;
}

export function CollectionsTableClient({ collections, total }: CollectionsTableClientProps) {
  const [editingCollection, setEditingCollection] = useState<CollectionRow | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [isPending, startTransition] = useTransition();

  const drawerOpen = isNew || editingCollection !== null;

  const closeDrawer = () => {
    setEditingCollection(null);
    setIsNew(false);
  };

  const handleDelete = (collection: CollectionRow) => {
    if (!confirm(`¿Eliminar la colección "${collection.name}"?`)) return;
    startTransition(async () => {
      const result = await deleteCollection(collection.id);
      if (result.success) {
        toast.success(`"${collection.name}" eliminada`);
        window.location.reload();
      } else {
        toast.error(result.error);
      }
    });
  };

  const columns: Column<CollectionRow>[] = [
    {
      header: "Colección",
      render: (c) => (
        <div className="flex items-center gap-3">
          {c.imageUrl ? (
            <img
              src={c.imageUrl}
              alt={c.name}
              className="w-8 h-8 object-cover shrink-0 border border-(--bd)"
            />
          ) : (
            <div className="w-8 h-8 shrink-0 bg-surf border border-(--bd) flex items-center justify-center text-[10px] text-muted font-display font-black">
              {c.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div className={cls.rowName}>{c.name}</div>
            <div className={cls.rowSub}>{c.slug}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Descripción",
      render: (c) => (
        <span className="text-[13px] text-muted line-clamp-1 max-w-xs">
          {c.description ?? "—"}
        </span>
      ),
    },
    {
      header: "Productos",
      headerClassName: "text-right",
      className: "text-right",
      render: (c) => <span className={cls.val}>{c.productCount}</span>,
    },
    {
      header: "Estado",
      render: (c) => (
        <StatusBadge
          config={
            c.active
              ? { label: "Activa", cls: "badge-green", outlineCls: "badge-green-outline" }
              : { label: "Inactiva", cls: "badge-red", outlineCls: "badge-red-outline" }
          }
        />
      ),
    },
    {
      header: "Acciones",
      headerClassName: "text-right",
      className: "text-right",
      render: (c) => (
        <div className="flex gap-1.5 justify-end">
          <Button
            variant="icon"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setIsNew(false); setEditingCollection(c); }}
            title="Editar"
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="icon"
            size="sm"
            destructive
            disabled={isPending}
            onClick={(e) => { e.stopPropagation(); handleDelete(c); }}
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
        title={`${total} colección${total !== 1 ? "es" : ""}`}
        align="center"
        side={
          <Button
            variant="accent"
            size="md"
            onClick={() => { setEditingCollection(null); setIsNew(true); }}
          >
            <Plus size={15} className="mr-2" /> Nueva colección
          </Button>
        }
      />

      {collections.length === 0 ? (
        <div className="text-center py-16 text-muted text-sm">
          No se encontraron colecciones.
        </div>
      ) : (
        <AdminTable
          columns={columns}
          data={collections}
          keyExtractor={(c) => c.id}
          onRowClick={(c) => { setEditingCollection(null); setViewingId(c.id); }}
        />
      )}

      {drawerOpen && (
        <CollectionCrudDrawer
          collection={editingCollection}
          isNew={isNew}
          onClose={closeDrawer}
        />
      )}

      {viewingId && (
        <EntityProductsDrawer
          entityId={viewingId}
          entityName={collections.find((c) => c.id === viewingId)?.name ?? ""}
          entityType="collection"
          onClose={() => setViewingId(null)}
        />
      )}
    </div>
  );
}
