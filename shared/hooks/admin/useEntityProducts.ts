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
import type { ActionResult } from '@/shared/types/action-result.types'
import type { DrawerProduct } from '@/shared/types/entity-products.types'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// useEntityProducts — estado y acciones de "productos de una colección /
// marca / categoría". Lo comparten EntityProductsPanel (dentro del drawer de
// edición) y EntityProductsDrawer (drawer independiente desde la tabla), que
// quedan como vistas.
//
// - Los errores de carga quedan visibles (`loadError` + `reload`), en vez de
//   pintarse como "sin productos".
// - Las respuestas viejas se descartan: cada carga/búsqueda tiene su
//   AbortController y se aborta al cambiar de entidad, de query o al desmontar.
// - Modo pendiente (sin `entityId`): la entidad aún no existe, la selección
//   vive en `staged` y se informa con `onStagedChange`; no toca la BD.
// ---------------------------------------------------------------------------

export type EntityType = 'collection' | 'brand' | 'category'

interface UseEntityProductsOptions {
  entityType: EntityType
  entityId?: string | null
  /** Modo pendiente: productos elegidos hasta ahora. */
  staged?: DrawerProduct[]
  /** Modo pendiente: informa al formulario de cada cambio de la selección. */
  onStagedChange?: (products: DrawerProduct[]) => void
  /** Espera antes de buscar mientras se escribe. */
  searchDebounceMs?: number
}

/** Longitud mínima de la búsqueda — por debajo, la vista oculta los resultados. */
export const ENTITY_PRODUCTS_MIN_QUERY = 2

const LOAD_ERROR = 'No se pudieron cargar los productos'

// Referencia estable para "sin productos". Un `[]` literal (en el default de
// `staged` o mientras carga) es un array nuevo en cada render, y `products`
// es dependencia del efecto de búsqueda: el debounce se reiniciaría en cada
// render y la búsqueda podría no dispararse nunca.
const NO_PRODUCTS: DrawerProduct[] = []

function loadEntityProducts(type: EntityType, id: string): Promise<ActionResult<DrawerProduct[]>> {
  switch (type) {
    case 'collection':
      return getCollectionProducts(id)
    case 'brand':
      return getBrandProducts(id)
    case 'category':
      return getCategoryProducts(id)
  }
}

/** Asocia el producto a la entidad. En marca/categoría equivale a reasignarlo. */
function addToEntity(type: EntityType, entityId: string, productId: string): Promise<ActionResult> {
  switch (type) {
    case 'collection':
      return addProductToCollection(entityId, productId)
    case 'brand':
      return reassignProductBrand(productId, entityId)
    case 'category':
      return reassignProductCategory(productId, entityId)
  }
}

interface LoadedState {
  key: string
  products: DrawerProduct[]
  error: string | null
}

export function useEntityProducts({
  entityType,
  entityId,
  staged = NO_PRODUCTS,
  onStagedChange,
  searchDebounceMs = 300,
}: UseEntityProductsOptions) {
  /** Sin ID todavía: la selección vive en memoria hasta que se guarde. */
  const isStaged = !entityId

  // Carga con estado derivado: `loaded.key` indica de qué entidad (y de qué
  // intento) es la lista cargada. Mientras no coincida, `loading` se deriva en
  // render — evita el setState síncrono dentro del efecto. `attempt` cambia la
  // clave para que `reload()` vuelva a disparar la carga.
  const [attempt, setAttempt] = useState(0)
  const entityKey = `${entityType}:${entityId}:${attempt}`
  const [loaded, setLoaded] = useState<LoadedState>({ key: '', products: NO_PRODUCTS, error: null })

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DrawerProduct[]>([])
  // Término de la última búsqueda completada: hasta que llega la primera
  // respuesta no hay resultados que mostrar (ni un "Sin resultados" prematuro).
  const [resultsFor, setResultsFor] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const loading = !isStaged && loaded.key !== entityKey
  const loadError = !isStaged && !loading ? loaded.error : null
  const products = isStaged ? staged : loading ? NO_PRODUCTS : loaded.products

  const updateProducts = (updater: (prev: DrawerProduct[]) => DrawerProduct[]) => {
    if (isStaged) {
      onStagedChange?.(updater(staged))
      return
    }
    setLoaded((prev) => ({
      key: entityKey,
      products: updater(prev.key === entityKey ? prev.products : NO_PRODUCTS),
      error: null,
    }))
  }

  // Carga inicial — en modo pendiente no hay nada que cargar
  useEffect(() => {
    if (!entityId) return
    const controller = new AbortController()
    const key = entityKey
    loadEntityProducts(entityType, entityId)
      .then((result) => {
        if (controller.signal.aborted) return
        setLoaded(
          result.success
            ? { key, products: result.data, error: null }
            : { key, products: NO_PRODUCTS, error: result.error || LOAD_ERROR },
        )
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setLoaded({ key, products: NO_PRODUCTS, error: LOAD_ERROR })
      })
    return () => controller.abort()
  }, [entityId, entityType, entityKey])

  // Búsqueda con debounce. Todos los setState viven dentro del callback del
  // setTimeout (no en el cuerpo del efecto); el abort descarta la respuesta
  // de una query que ya no es la actual.
  useEffect(() => {
    const term = query.trim()
    if (term.length < ENTITY_PRODUCTS_MIN_QUERY) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const r = await searchAvailableProducts(
          term,
          products.map((p) => p.id),
        )
        if (controller.signal.aborted) return
        setResults(r.success ? r.data : [])
        setResultsFor(term)
        if (!r.success) toast.error(r.error)
      } catch {
        if (!controller.signal.aborted) toast.error('No se pudo buscar productos')
      } finally {
        if (!controller.signal.aborted) setSearching(false)
      }
    }, searchDebounceMs)
    return () => {
      clearTimeout(timer)
      controller.abort()
      // Si se abortó en vuelo, el `finally` ya no apaga el spinner.
      setSearching(false)
    }
  }, [query, products, searchDebounceMs])

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setResultsFor(null)
  }

  /** Ejecuta una acción por producto con su indicador; devuelve si salió bien. */
  const runForProduct = async (
    productId: string,
    action: () => Promise<ActionResult>,
    fallbackError: string,
  ): Promise<boolean> => {
    setPendingId(productId)
    try {
      const r = await action()
      if (!r.success) toast.error(r.error || fallbackError)
      return r.success
    } catch {
      toast.error(fallbackError)
      return false
    } finally {
      setPendingId(null)
    }
  }

  const add = async (product: DrawerProduct): Promise<boolean> => {
    const append = (prev: DrawerProduct[]) =>
      prev.some((p) => p.id === product.id) ? prev : [...prev, product]

    if (!entityId) {
      updateProducts(append)
      return true
    }
    const ok = await runForProduct(
      product.id,
      () => addToEntity(entityType, entityId, product.id),
      'No se pudo agregar el producto',
    )
    if (ok) {
      updateProducts(append)
      setResults((prev) => prev.filter((p) => p.id !== product.id))
      toast.success(`"${product.name}" agregado`)
    }
    return ok
  }

  /** Quitar solo existe en colecciones (marca/categoría son FK obligatorias) o en modo pendiente. */
  const canRemove = isStaged || entityType === 'collection'

  const remove = async (product: DrawerProduct): Promise<boolean> => {
    const without = (prev: DrawerProduct[]) => prev.filter((p) => p.id !== product.id)
    if (!entityId) {
      updateProducts(without)
      return true
    }
    if (entityType !== 'collection') return false
    const ok = await runForProduct(
      product.id,
      () => removeProductFromCollection(entityId, product.id),
      'No se pudo eliminar el producto',
    )
    if (ok) {
      updateProducts(without)
      toast.success(`"${product.name}" eliminado de la colección`)
    }
    return ok
  }

  /** Marca/categoría: mueve el producto a otra entidad (sale de esta lista). */
  const reassign = async (productId: string, targetEntityId: string): Promise<boolean> => {
    if (!entityId || entityType === 'collection') return false
    const ok = await runForProduct(
      productId,
      () =>
        entityType === 'brand'
          ? reassignProductBrand(productId, targetEntityId)
          : reassignProductCategory(productId, targetEntityId),
      'Error al reasignar',
    )
    if (ok) {
      updateProducts((prev) => prev.filter((p) => p.id !== productId))
      toast.success('Producto reasignado')
    }
    return ok
  }

  return {
    isStaged,
    products,
    loading,
    loadError,
    reload: () => setAttempt((n) => n + 1),
    canRemove,
    /** Producto con una acción en curso (o null). */
    pendingId,
    isPending: pendingId !== null,
    add,
    remove,
    reassign,
    search: {
      query,
      setQuery,
      results,
      searching,
      /** La query alcanza el mínimo para buscar (si no, la vista oculta resultados). */
      active: query.trim().length >= ENTITY_PRODUCTS_MIN_QUERY,
      /** Ya hubo al menos una respuesta de búsqueda desde el último `clear`. */
      hasResults: resultsFor !== null,
      clear: clearSearch,
    },
  }
}
