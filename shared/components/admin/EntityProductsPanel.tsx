'use client'

import { getBrandProducts, reassignProductBrand } from '@/features/brands/actions/brand.actions'
import {
  getCategoryProducts,
  reassignProductCategory,
} from '@/features/categories/actions/category.actions'
import {
  addProductToCollection,
  getCollectionProducts,
  removeProductFromCollection,
} from '@/features/collections/actions/collection.actions'
import { searchAvailableProducts } from '@/features/products/actions/product.actions'
import type { DrawerProduct } from '@/shared/types/entity-products.types'
import { Loader2, Package, Plus, Search, X } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type EntityType = 'collection' | 'brand' | 'category'

interface EntityProductsPanelProps {
  /** ID de la entidad. Sólo se muestra cuando existe (modo edición). */
  entityId: string
  entityType: EntityType
}

// ---------------------------------------------------------------------------
// Helpers de actions
// ---------------------------------------------------------------------------

async function loadProducts(type: EntityType, id: string): Promise<DrawerProduct[]> {
  switch (type) {
    case 'collection': {
      const r = await getCollectionProducts(id)
      return r.success ? r.data : []
    }
    case 'brand': {
      const r = await getBrandProducts(id)
      return r.success ? r.data : []
    }
    case 'category': {
      const r = await getCategoryProducts(id)
      return r.success ? r.data : []
    }
  }
}

async function doAddProduct(
  type: EntityType,
  entityId: string,
  productId: string,
): Promise<boolean> {
  switch (type) {
    case 'collection': {
      const r = await addProductToCollection(entityId, productId)
      return r.success
    }
    case 'brand': {
      const r = await reassignProductBrand(productId, entityId)
      return r.success
    }
    case 'category': {
      const r = await reassignProductCategory(productId, entityId)
      return r.success
    }
  }
}

async function doRemoveProduct(entityId: string, productId: string): Promise<boolean> {
  const r = await removeProductFromCollection(entityId, productId)
  return r.success
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function EntityProductsPanel({ entityId, entityType }: EntityProductsPanelProps) {
  const [products, setProducts] = useState<DrawerProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DrawerProduct[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const searchBoxRef = useRef<HTMLDivElement>(null)

  // Carga inicial
  useEffect(() => {
    setLoading(true)
    loadProducts(entityType, entityId).then((data) => {
      setProducts(data)
      setLoading(false)
    })
  }, [entityId, entityType])

  // Búsqueda con debounce
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([])
      setShowResults(false)
      return
    }
    setSearching(true)
    const timer = setTimeout(async () => {
      const excludeIds = products.map((p) => p.id)
      const r = await searchAvailableProducts(query, excludeIds)
      setResults(r.success ? r.data : [])
      setShowResults(true)
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, products])

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

  const handleAdd = async (product: DrawerProduct) => {
    setActionId(product.id)
    const ok = await doAddProduct(entityType, entityId, product.id)
    setActionId(null)
    if (ok) {
      setProducts((prev) => [...prev, product])
      setQuery('')
      setResults([])
      setShowResults(false)
      toast.success(`"${product.name}" agregado`)
    } else {
      toast.error('No se pudo agregar el producto')
    }
  }

  const handleRemove = async (product: DrawerProduct) => {
    setActionId(product.id)
    const ok = await doRemoveProduct(entityId, product.id)
    setActionId(null)
    if (ok) {
      setProducts((prev) => prev.filter((p) => p.id !== product.id))
      toast.success(`"${product.name}" eliminado de la colección`)
    } else {
      toast.error('No se pudo eliminar el producto')
    }
  }

  const canRemove = entityType === 'collection'

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
        <span className="text-[10px] tracking-[2px] uppercase font-extrabold text-(--gold)">
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
            onChange={(e) => setQuery(e.target.value)}
            placeholder={addPlaceholder}
            className="w-full pl-8 pr-3 py-2.5 text-[13px] bg-card border border-(--bd) outline-none focus:border-(--bdh) placeholder:text-muted"
          />
          {searching && <Loader2 size={13} className="absolute right-3 text-muted animate-spin" />}
        </div>

        {/* Dropdown de resultados */}
        {showResults && (
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
                    <Plus size={14} className="ml-auto text-(--gold) shrink-0" />
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
                  onClick={() => handleRemove(p)}
                  className="p-1.5 text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
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
