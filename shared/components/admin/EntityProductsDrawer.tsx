"use client";

import { useState } from "react";
import { X, Search, Loader2, AlertCircle } from "lucide-react";
import { AdminDrawer } from "@/shared/components/admin/AdminDrawer";
import { Button } from "@/shared/components/ui/Button";
import { Select } from "@/shared/components/ui/Select";
import { StockBadge } from "@/features/inventory/components/StockBadge";
import { PRODUCT_STATUS_LABELS } from "@/features/products/lib/product-status";
import { useEntityProducts, type EntityType } from "@/shared/hooks/admin/useEntityProducts";
import { cls } from "@/shared/lib/admin/admin-classes";
import { formatCurrency } from "@/shared/lib/utils";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface EntityProductsDrawerProps {
  entityId: string;
  entityName: string;
  entityType: EntityType;
  allBrands?: { id: string; name: string }[];
  allCategories?: { id: string; name: string }[];
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Componente — vista; estado y acciones viven en useEntityProducts
// ---------------------------------------------------------------------------

export function EntityProductsDrawer({
  entityId,
  entityName,
  entityType,
  allBrands = [],
  allCategories = [],
  onClose,
}: EntityProductsDrawerProps) {
  const {
    products,
    loading,
    loadError,
    reload,
    isPending,
    add,
    remove,
    reassign,
    search,
  } = useEntityProducts({ entityType, entityId, searchDebounceMs: 350 });

  // Búsqueda: abrir/cerrar el buscador es puramente de esta vista
  const [showSearch, setShowSearch] = useState(false);

  // Reasignación inline (brands / categories)
  const [reassigningId, setReassigningId] = useState<string | null>(null);

  const handleReassign = async (productId: string, newEntityId: string) => {
    if (await reassign(productId, newEntityId)) setReassigningId(null);
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

      {/* Error de carga — visible, no se confunde con "sin productos" */}
      {!loading && loadError && (
        <div role="alert" className="flex flex-col items-center gap-3 py-10 text-center text-danger text-[13px]">
          <AlertCircle size={18} />
          {loadError}
          <Button variant="outline" size="sm" onClick={reload}>
            Reintentar
          </Button>
        </div>
      )}

      {/* Lista de productos */}
      {!loading && !loadError && (
        <>
          {products.length === 0 ? (
            <div className="py-10 text-center text-muted text-[13px]">
              Esta {entityLabel} no tiene productos aún.
            </div>
          ) : (
            <div className="border border-(--bd) overflow-x-auto">
              <div className="min-w-100 flex flex-col gap-0">
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
                      {p.sku} · {PRODUCT_STATUS_LABELS[p.status as keyof typeof PRODUCT_STATUS_LABELS] ?? p.status}
                    </div>
                  </div>

                  {/* Precio */}
                  <span className="font-display font-extrabold text-[13px] text-accent-ink whitespace-nowrap">
                    {formatCurrency(p.price)}
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
                        onClick={() => remove(p)}
                        title="Quitar de la colección"
                      >
                        <X size={13} />
                      </Button>
                    )}

                    {(entityType === "brand" || entityType === "category") && (
                      <div className="relative">
                        {reassigningId === p.id ? (
                          <Select
                            autoFocus
                            className="text-[12px] py-1.5 px-2 min-w-[130px]"
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
                          </Select>
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
                    value={search.query}
                    onChange={(e) => search.setQuery(e.target.value)}
                    placeholder="Buscar por nombre o SKU..."
                    className={cls.input + " pl-9 text-[13px]"}
                  />
                  {search.searching && (
                    <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted animate-spin" />
                  )}
                </div>

                {/* Resultados */}
                {search.active && search.results.length > 0 && (
                  <div className="border border-(--bd) overflow-hidden">
                    {search.results.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        disabled={isPending}
                        onClick={() => add(r)}
                        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 border-b border-(--bd) last:border-b-0 text-left hover:bg-(--card-h) transition-colors disabled:opacity-50"
                      >
                        <div className="min-w-0">
                          <div className="font-display font-extrabold text-[13px] uppercase truncate">
                            {r.name}
                          </div>
                          <div className="text-[11px] text-muted font-mono">{r.sku}</div>
                        </div>
                        <span className="text-[12px] text-accent-ink font-display font-bold whitespace-nowrap shrink-0">
                          + Agregar
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {search.active && search.hasResults && !search.searching && search.results.length === 0 && (
                  <p className="text-[12px] text-muted text-center py-2">
                    No se encontraron productos disponibles.
                  </p>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowSearch(false); search.clear(); }}
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
