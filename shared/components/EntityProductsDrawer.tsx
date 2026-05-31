"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { X, Search, Loader2 } from "lucide-react";
import { AdminDrawer } from "@/shared/components/AdminDrawer";
import { Button } from "@/shared/components/ui/Button";
import { StockBadge } from "@/shared/components/StockBadge";
import { cls } from "@/shared/lib/admin-classes";
import type { DrawerProduct } from "@/shared/types/entity-products.types";
import {
  getCollectionProducts,
  addProductToCollection,
  removeProductFromCollection,
} from "@/features/collections/actions/collection.actions";
import {
  getBrandProducts,
  reassignProductBrand,
} from "@/features/brands/actions/brand.actions";
import {
  getCategoryProducts,
  reassignProductCategory,
} from "@/features/categories/actions/category.actions";
import { searchAvailableProducts } from "@/features/products/actions/product.actions";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface EntityProductsDrawerProps {
  entityId: string;
  entityName: string;
  entityType: "collection" | "brand" | "category";
  allBrands?: { id: string; name: string }[];
  allCategories?: { id: string; name: string }[];
  onClose: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE:   "Disponible",
  PREORDER:    "Preventa",
  SOLD_OUT:    "Agotado",
  COMING_SOON: "Próximamente",
  ARCHIVED:    "Archivado",
};

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function EntityProductsDrawer({
  entityId,
  entityName,
  entityType,
  allBrands = [],
  allCategories = [],
  onClose,
}: EntityProductsDrawerProps) {
  const [products, setProducts] = useState<DrawerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Búsqueda
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DrawerProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reasignación inline (brands / categories)
  const [reassigningId, setReassigningId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Carga inicial
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      let result: { success: true; data: DrawerProduct[] } | { success: false; error: string };

      if (entityType === "collection") {
        result = await getCollectionProducts(entityId);
      } else if (entityType === "brand") {
        result = await getBrandProducts(entityId);
      } else {
        result = await getCategoryProducts(entityId);
      }

      if (cancelled) return;

      if (result.success) {
        setProducts(result.data);
      } else {
        toast.error(result.error);
      }
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [entityId, entityType]);

  // ---------------------------------------------------------------------------
  // Búsqueda con debounce
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      const currentIds = products.map((p) => p.id);
      const result = await searchAvailableProducts(searchQuery.trim(), currentIds);
      setSearching(false);
      if (result.success) {
        setSearchResults(result.data);
      }
    }, 350);

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchQuery, products]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleRemove = (product: DrawerProduct) => {
    if (entityType !== "collection") return;
    startTransition(async () => {
      const result = await removeProductFromCollection(entityId, product.id);
      if (result.success) {
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
        toast.success(`"${product.name}" eliminado de la colección`);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleReassign = (productId: string, newEntityId: string) => {
    startTransition(async () => {
      let result: { success: boolean; error?: string };

      if (entityType === "brand") {
        result = await reassignProductBrand(productId, newEntityId);
      } else {
        result = await reassignProductCategory(productId, newEntityId);
      }

      if (result.success) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        setReassigningId(null);
        toast.success("Producto reasignado");
      } else {
        toast.error(result.error ?? "Error al reasignar");
      }
    });
  };

  const handleAddFromSearch = (product: DrawerProduct) => {
    startTransition(async () => {
      let result: { success: boolean; error?: string };

      if (entityType === "collection") {
        result = await addProductToCollection(entityId, product.id);
      } else if (entityType === "brand") {
        result = await reassignProductBrand(product.id, entityId);
      } else {
        result = await reassignProductCategory(product.id, entityId);
      }

      if (result.success) {
        setProducts((prev) => {
          if (prev.some((p) => p.id === product.id)) return prev;
          return [...prev, product];
        });
        setSearchResults((prev) => prev.filter((p) => p.id !== product.id));
        toast.success(`"${product.name}" agregado`);
      } else {
        toast.error(result.error ?? "Error al agregar");
      }
    });
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const entityLabel =
    entityType === "collection" ? "colección" :
    entityType === "brand" ? "marca" : "categoría";

  const reassignOptions =
    entityType === "brand" ? allBrands.filter((b) => b.id !== entityId) :
    entityType === "category" ? allCategories.filter((c) => c.id !== entityId) :
    [];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <AdminDrawer
      title={entityName}
      sub={`Productos de la ${entityLabel}`}
      onClose={onClose}
    >
      {/* Estado de carga */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-12 text-muted text-[13px]">
          <Loader2 size={16} className="animate-spin" />
          Cargando productos...
        </div>
      )}

      {/* Lista de productos */}
      {!loading && (
        <>
          {products.length === 0 ? (
            <div className="py-10 text-center text-muted text-[13px]">
              Esta {entityLabel} no tiene productos aún.
            </div>
          ) : (
            <div className="flex flex-col gap-0 border border-(--bd) overflow-hidden">
              {/* Cabecera */}
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-2.5 bg-surf border-b border-(--bd)">
                <span className={cls.th + " bg-transparent border-none py-0 px-0"}>Producto</span>
                <span className={cls.th + " bg-transparent border-none py-0 px-0"}>Precio</span>
                <span className={cls.th + " bg-transparent border-none py-0 px-0"}>Stock</span>
                <span className={cls.th + " bg-transparent border-none py-0 px-0 text-right"}>
                  {entityType === "collection" ? "Quitar" : "Reasignar"}
                </span>
              </div>

              {/* Filas */}
              {products.map((p) => (
                <div
                  key={p.id}
                  className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-3 border-b border-(--bd) last:border-b-0 items-center"
                >
                  {/* Nombre + SKU */}
                  <div className="min-w-0">
                    <div className="font-display font-extrabold text-[13px] uppercase truncate">
                      {p.name}
                    </div>
                    <div className="text-[11px] text-muted tracking-[1px] font-mono">
                      {p.sku} · {STATUS_LABELS[p.status] ?? p.status}
                    </div>
                  </div>

                  {/* Precio */}
                  <span className="font-display font-extrabold text-[13px] text-(--gold) whitespace-nowrap">
                    S/ {p.price.toFixed(2)}
                  </span>

                  {/* Stock */}
                  <StockBadge s={p.stock} />

                  {/* Acción */}
                  <div className="flex justify-end">
                    {entityType === "collection" && (
                      <Button
                        variant="icon"
                        size="sm"
                        destructive
                        disabled={isPending}
                        onClick={() => handleRemove(p)}
                        title="Quitar de la colección"
                      >
                        <X size={13} />
                      </Button>
                    )}

                    {(entityType === "brand" || entityType === "category") && (
                      <div className="relative">
                        {reassigningId === p.id ? (
                          <select
                            autoFocus
                            className={cls.input + " text-[12px] py-1.5 px-2 pr-6 min-w-[130px]"}
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) handleReassign(p.id, e.target.value);
                            }}
                            onBlur={() => setReassigningId(null)}
                          >
                            <option value="" disabled>Seleccionar...</option>
                            {reassignOptions.map((opt) => (
                              <option key={opt.id} value={opt.id}>{opt.name}</option>
                            ))}
                          </select>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isPending}
                            onClick={() => setReassigningId(p.id)}
                          >
                            Reasignar
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Nota para brands/categories — no hay "quitar" porque FK required */}
          {(entityType === "brand" || entityType === "category") && products.length > 0 && (
            <p className="text-[11px] text-muted leading-relaxed">
              Para quitar un producto de esta {entityLabel}, edítalo directamente desde la tabla de productos.
            </p>
          )}

          {/* Sección agregar producto */}
          <div className="border-t border-(--bd) pt-4 mt-2">
            {!showSearch ? (
              <Button
                variant="outline"
                size="md"
                full
                onClick={() => setShowSearch(true)}
              >
                + Agregar producto
              </Button>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nombre o SKU..."
                    className={cls.input + " pl-9 text-[13px]"}
                  />
                  {searching && (
                    <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted animate-spin" />
                  )}
                </div>

                {/* Resultados */}
                {searchResults.length > 0 && (
                  <div className="border border-(--bd) overflow-hidden">
                    {searchResults.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        disabled={isPending}
                        onClick={() => handleAddFromSearch(r)}
                        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 border-b border-(--bd) last:border-b-0 text-left hover:bg-(--card-h) transition-colors disabled:opacity-50"
                      >
                        <div className="min-w-0">
                          <div className="font-display font-extrabold text-[13px] uppercase truncate">
                            {r.name}
                          </div>
                          <div className="text-[11px] text-muted font-mono">{r.sku}</div>
                        </div>
                        <span className="text-[12px] text-(--gold) font-display font-bold whitespace-nowrap shrink-0">
                          + Agregar
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {searchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && (
                  <p className="text-[12px] text-muted text-center py-2">
                    No se encontraron productos disponibles.
                  </p>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowSearch(false); setSearchQuery(""); setSearchResults([]); }}
                >
                  Cancelar búsqueda
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </AdminDrawer>
  );
}
