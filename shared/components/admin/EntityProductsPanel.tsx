'use client'

import { Button } from '@/shared/components/ui/Button'
import { useEntityProducts, type EntityType } from '@/shared/hooks/admin/useEntityProducts'
import type { DrawerProduct } from '@/shared/types/entity-products.types'
import { AlertCircle, Loader2, Package, Plus, Search, X } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type { EntityType }

interface EntityProductsPanelProps {
  /**
   * ID de la entidad. Si falta, el panel entra en modo "pendiente": la entidad
   * todavía no existe (drawer de creación), así que la selección se mantiene en
   * memoria y la envía el formulario al crear, en vez de tocar la BD aquí.
   */
  entityId?: string | null
  entityType: EntityType
  /** Modo pendiente: productos elegidos hasta ahora. */
  staged?: DrawerProduct[]
  /** Modo pendiente: informa al formulario de cada cambio de la selección. */
  onStagedChange?: (products: DrawerProduct[]) => void
}

// ---------------------------------------------------------------------------
// Componente — vista; estado y acciones viven en useEntityProducts
// ---------------------------------------------------------------------------

export function EntityProductsPanel({
  entityId,
  entityType,
  staged,
  onStagedChange,
}: EntityProductsPanelProps) {
  const {
    isStaged,
    products,
    loading,
    loadError,
    reload,
    canRemove,
    pendingId: actionId,
    add,
    remove,
    search,
  } = useEntityProducts({ entityType, entityId, staged, onStagedChange })
  const { query, results, searching } = search
  const [showResults, setShowResults] = useState(false)
  const searchBoxRef = useRef<HTMLDivElement>(null)

  // Cierra dropdown al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const clearSearch = () => {
    search.clear()
    setShowResults(false)
  }

  const handleAdd = async (product: DrawerProduct) => {
    if (await add(product)) clearSearch()
  }

  const addPlaceholder =
    entityType === 'collection'
      ? 'Buscar producto para agregar...'
      : entityType === 'brand'
        ? 'Buscar producto para reasignar a esta marca...'
        : 'Buscar producto para reasignar a esta categoría...'

  return (
    <div className="flex flex-col gap-3">
      {/* Título sección */}
      <div className="flex items-center gap-2 pt-1">
        <div className="h-px flex-1 bg-(--bd)" />
        <span className="text-[10px] tracking-[2px] uppercase font-extrabold text-accent-ink">
          Productos ({loading ? '…' : products.length})
        </span>
        <div className="h-px flex-1 bg-(--bd)" />
      </div>

      {/* Buscador de productos */}
      <div ref={searchBoxRef} className="relative">
        <div className="relative flex items-center">
          <Search size={13} className="absolute left-3 text-muted pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              search.setQuery(e.target.value)
              setShowResults(true)
            }}
            placeholder={addPlaceholder}
            className="w-full pl-8 pr-3 py-2.5 text-[13px] bg-card border border-(--bd) outline-none focus:border-(--bdh) placeholder:text-muted"
          />
          {searching && <Loader2 size={13} className="absolute right-3 text-muted animate-spin" />}
        </div>

        {/* Dropdown de resultados */}
        {showResults && search.active && search.hasResults && (
          <div className="absolute z-50 top-full w-full bg-(--surf) border border-(--bd) shadow-lg overflow-hidden max-h-60 overflow-y-auto">
            {results.length === 0 ? (
              <div className="px-4 py-3 text-[13px] text-muted">Sin resultados</div>
            ) : (
              results.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={actionId === p.id}
                  onClick={() => handleAdd(p)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-card transition-colors text-left disabled:opacity-50"
                >
                  <div className="size-8 bg-card shrink-0 overflow-hidden flex items-center justify-center">
                    {p.imageUrl ? (
                      <Image
                        src={p.imageUrl}
                        alt={p.name}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package size={13} className="text-muted" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium truncate">{p.name}</div>
                    <div className="text-[11px] text-muted">
                      {p.sku} · {p.brand}
                    </div>
                  </div>
                  {actionId === p.id ? (
                    <Loader2 size={13} className="ml-auto animate-spin text-muted" />
                  ) : (
                    <Plus size={14} className="ml-auto text-accent-ink shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Lista de productos actuales */}
      <div className="border border-(--bd) overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-muted">
            <Loader2 size={16} className="animate-spin" />
          </div>
        ) : loadError ? (
          <div
            role="alert"
            className="flex flex-col items-center justify-center py-6 gap-2 text-danger"
          >
            <AlertCircle size={18} />
            <span className="text-[13px]">{loadError}</span>
            <Button type="button" variant="outline" size="sm" onClick={reload}>
              Reintentar
            </Button>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2 text-muted">
            <Package size={18} />
            <span className="text-[13px]">Sin productos asociados</span>
          </div>
        ) : (
          products.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center gap-3 px-3 py-2.5 ${i > 0 ? 'border-t border-(--bd)' : ''}`}
            >
              <div className="size-9 bg-card shrink-0 overflow-hidden flex items-center justify-center">
                {p.imageUrl ? (
                  <Image
                    src={p.imageUrl}
                    alt={p.name}
                    width={36}
                    height={36}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package size={13} className="text-muted" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium truncate">{p.name}</div>
                <div className="text-[11px] text-muted">
                  {p.sku} · Stock: {p.stock}
                </div>
              </div>
              {canRemove && (
                <button
                  type="button"
                  disabled={actionId === p.id}
                  onClick={() => remove(p)}
                  className="p-1.5 text-muted hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                  title="Quitar de la colección"
                >
                  {actionId === p.id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <X size={13} />
                  )}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {isStaged && products.length > 0 && (
        <p className="text-[11px] text-muted leading-relaxed">
          {products.length} producto{products.length !== 1 ? 's' : ''} se asociará
          {products.length !== 1 ? 'n' : ''} al guardar la colección.
        </p>
      )}

      {/* Nota informativa para brand/category */}
      {!canRemove && (
        <p className="text-[11px] text-muted leading-relaxed">
          Para cambiar la {entityType === 'brand' ? 'marca' : 'categoría'} de un producto, edítalo
          directamente desde el panel de Productos.
        </p>
      )}
    </div>
  )
}
