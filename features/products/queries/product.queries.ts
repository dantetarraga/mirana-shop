import type {
  ProductAdminListItem,
  ProductDetail,
  ProductFilters,
  ProductListItem,
} from '@/features/products/types'
import { DEFAULT_CATALOG_STATUSES } from '@/features/products/lib/availability'
import {
  cachedQuery,
  CACHE_TAGS,
  REVALIDATE_SHORT,
  reviveDate,
  reviveDecimal,
} from '@/shared/lib/data-cache'
import { db } from '@/shared/lib/db'
import { cache } from 'react'
import 'server-only'

const LOW_STOCK_THRESHOLD = 8

export const PRODUCT_LIST_SELECT = {
  id: true,
  sku: true,
  slug: true,
  name: true,
  price: true,
  salePrice: true,
  status: true,
  featured: true,
  createdAt: true,
  // Preventa parcial: las cards y el PDP necesitan poder calcular el
  // adelanto sin una consulta extra (ver features/checkout/lib/preorder.ts).
  allowPartialPreorder: true,
  preorderDepositPercent: true,
  estimatedArrival: true,
  category: { select: { id: true, name: true, slug: true } },
  brand: { select: { id: true, name: true, slug: true } },
  images: {
    select: { id: true, url: true, alt: true, position: true },
    orderBy: { position: 'asc' as const },
    // Sin take: 1 — necesitamos todas las imágenes para el form de edición
  },
  inventory: { select: { availableStock: true } },
  collections: {
    // Las colecciones se borran en soft: sin este filtro el producto seguiría
    // mostrando chips de colecciones que ya no existen (y esas filas gastarían
    // los 3 cupos del take).
    where: { collection: { deletedAt: null } },
    select: {
      collection: { select: { id: true, name: true, slug: true } },
    },
    take: 3,
  },
} as const

// El listado público no necesita la descripción (puede ser HTML largo), pero
// el listado del admin sí: es lo que alimenta el formulario de edición.
export const PRODUCT_ADMIN_LIST_SELECT = {
  ...PRODUCT_LIST_SELECT,
  description: true,
  // Solo el admin las necesita: son las casillas de "Secciones del inicio" del
  // formulario. La tienda pinta las secciones desde su propia consulta.
  homeSections: { select: { sectionId: true } },
} as const

export const PRODUCT_DETAIL_SELECT = {
  ...PRODUCT_LIST_SELECT,
  description: true,
  currency: true,
  createdAt: true,
  updatedAt: true,
  images: {
    select: { id: true, url: true, alt: true, position: true },
    orderBy: { position: 'asc' as const },
  },
} as const

function buildWhere(filters: Omit<ProductFilters, 'take' | 'skip'>) {
  const {
    categorySlug,
    brandSlug,
    collectionSlug,
    search,
    featured,
    status,
    stockFilter,
    hideOutOfStock,
    priceMin,
    priceMax,
    onSale,
  } = filters

  const catSlugs = categorySlug
    ? Array.isArray(categorySlug)
      ? categorySlug
      : [categorySlug]
    : undefined
  const brdSlugs = brandSlug ? (Array.isArray(brandSlug) ? brandSlug : [brandSlug]) : undefined
  const colSlugs = collectionSlug
    ? Array.isArray(collectionSlug)
      ? collectionSlug
      : [collectionSlug]
    : undefined

  // Omitir `status` significa "lo que ve el público": disponible, preventa y
  // agotado. Antes el implícito era solo AVAILABLE, así que cualquier consumidor
  // que no lo pasara (buscador, relacionados) escondía las preventas sin querer
  // y contradecía a /catalogo, que sí las lista. Para incluirlo todo —vistas de
  // admin— hay que pedir 'ALL' explícitamente.
  const statusWhere =
    status === undefined
      ? { in: DEFAULT_CATALOG_STATUSES }
      : status === 'ALL'
        ? undefined
        : Array.isArray(status)
          ? { in: status }
          : status

  const inventoryWhere =
    stockFilter === 'low'
      ? { inventory: { availableStock: { gt: 0, lte: LOW_STOCK_THRESHOLD } } }
      : stockFilter === 'out'
        ? { inventory: { availableStock: 0 } }
        : stockFilter === 'in'
          ? { inventory: { availableStock: { gt: 0 } } }
          : {}

  const priceWhere =
    priceMin != null || priceMax != null
      ? { price: { gte: priceMin ?? undefined, lte: priceMax ?? undefined } }
      : {}

  // "No mostrar productos sin stock": fuera los SOLD_OUT y los que se quedaron
  // en cero. La preventa se salva del filtro de inventario porque por
  // definición aún no tiene unidades — se reserva.
  const purchasableWhere = hideOutOfStock
    ? {
        NOT: { status: 'SOLD_OUT' as const },
        OR: [
          { status: 'PREORDER' as const },
          { inventory: { availableStock: { gt: 0 } } },
        ],
      }
    : {}

  return {
    deletedAt: null,
    status: statusWhere,
    featured: featured ?? undefined,
    // Filtrar por una categoría incluye sus subcategorías: el producto puede
    // estar en la propia o en una hija. Con MAX_CATEGORY_DEPTH = 2 basta con
    // mirar un nivel hacia arriba, sin consulta previa de ids.
    category: catSlugs?.length
      ? { OR: [{ slug: { in: catSlugs } }, { parent: { slug: { in: catSlugs } } }] }
      : undefined,
    brand: brdSlugs?.length ? { slug: { in: brdSlugs } } : undefined,
    collections: colSlugs?.length
      ? { some: { collection: { slug: { in: colSlugs }, deletedAt: null } } }
      : undefined,
    // Va en AND para no chocar con el OR de purchasableWhere.
    AND: search
      ? [{ OR: [{ name: { contains: search } }, { sku: { contains: search } }] }]
      : undefined,
    salePrice: onSale ? { not: null } : undefined,
    ...inventoryWhere,
    ...priceWhere,
    ...purchasableWhere,
  }
}

function buildOrderBy(sort: ProductFilters['sort']) {
  switch (sort) {
    case 'price_asc':
      return [{ price: 'asc' as const }]
    case 'price_desc':
      return [{ price: 'desc' as const }]
    case 'newest':
      return [{ createdAt: 'desc' as const }]
    default:
      return [{ featured: 'desc' as const }, { createdAt: 'desc' as const }]
  }
}

// ---------------------------------------------------------------------------
// Lecturas
//
// Las versiones "a secas" (getProducts, countProducts, getAdminProducts,
// getProductById) solo se deduplican por request con `cache()`: las usan el
// admin, el buscador y las actions, que necesitan el dato fresco. Las de la
// tienda (getCatalogProducts, countCatalogProducts, getNewProducts,
// getFeaturedProducts, getProductBySlug) además van a la caché de datos entre
// requests con los tags 'products' y 'catalog', que invalidan las actions de
// productos, colecciones, secciones del inicio y papelera.
//
// `cache()` compara argumentos por identidad, así que las variantes que
// reciben un objeto de filtros se deduplican por su JSON.
// ---------------------------------------------------------------------------

const PRODUCT_CACHE_OPTIONS = {
  tags: [CACHE_TAGS.products, CACHE_TAGS.catalog],
  revalidate: REVALIDATE_SHORT,
}

/** Reconstruye Decimal y Date de un producto que pasó por la caché (JSON). */
function reviveProduct<T extends ProductListItem>(p: T): T {
  const revived: T = {
    ...p,
    price: reviveDecimal(p.price),
    salePrice: reviveDecimal(p.salePrice),
    createdAt: reviveDate(p.createdAt),
    estimatedArrival: reviveDate(p.estimatedArrival),
  }
  if ('updatedAt' in p) {
    ;(revived as T & { updatedAt: Date }).updatedAt = reviveDate(
      (p as T & { updatedAt: Date | string }).updatedAt,
    )
  }
  return revived
}

export function reviveProducts<T extends ProductListItem>(products: T[]): T[] {
  return products.map(reviveProduct)
}

/**
 * ¿Se puede cachear este listado entre requests? La búsqueda libre y los
 * rangos de precio vienen del usuario sin acotar: cachearlos llenaría la caché
 * con una entrada por cada combinación tecleada.
 */
function isCacheableFilter(filters: ProductFilters): boolean {
  return !filters.search && filters.priceMin == null && filters.priceMax == null
}

async function fetchProducts(filters: ProductFilters = {}): Promise<ProductListItem[]> {
  const { take = 50, skip = 0, sort } = filters

  return db.product.findMany({
    where: buildWhere(filters),
    select: PRODUCT_LIST_SELECT,
    orderBy: buildOrderBy(sort),
    take,
    skip,
  }) as Promise<ProductListItem[]>
}

async function fetchProductCount(
  filters: Omit<ProductFilters, 'take' | 'skip'> = {},
): Promise<number> {
  return db.product.count({ where: buildWhere(filters) })
}

const getProductsByKey = cache((key: string) => fetchProducts(JSON.parse(key) as ProductFilters))
const countProductsByKey = cache((key: string) =>
  fetchProductCount(JSON.parse(key) as ProductFilters),
)

export function getProducts(filters: ProductFilters = {}): Promise<ProductListItem[]> {
  return getProductsByKey(JSON.stringify(filters))
}

export function countProducts(filters: Omit<ProductFilters, 'take' | 'skip'> = {}): Promise<number> {
  return countProductsByKey(JSON.stringify(filters))
}

const fetchCatalogProductsCached = cachedQuery(fetchProducts, ['catalog-products'], {
  ...PRODUCT_CACHE_OPTIONS,
  revive: reviveProducts,
})
const countCatalogProductsCached = cachedQuery(fetchProductCount, ['catalog-products-count'], {
  ...PRODUCT_CACHE_OPTIONS,
})

const getCatalogProductsByKey = cache((key: string) => {
  const filters = JSON.parse(key) as ProductFilters
  return isCacheableFilter(filters) ? fetchCatalogProductsCached(filters) : fetchProducts(filters)
})
const countCatalogProductsByKey = cache((key: string) => {
  const filters = JSON.parse(key) as ProductFilters
  return isCacheableFilter(filters) ? countCatalogProductsCached(filters) : fetchProductCount(filters)
})

/** Listado público (catálogo, relacionados, inicio) — cacheado entre requests. */
export function getCatalogProducts(filters: ProductFilters = {}): Promise<ProductListItem[]> {
  return getCatalogProductsByKey(JSON.stringify(filters))
}

/** Conteo público del catálogo — cacheado entre requests. */
export function countCatalogProducts(
  filters: Omit<ProductFilters, 'take' | 'skip'> = {},
): Promise<number> {
  return countCatalogProductsByKey(JSON.stringify(filters))
}

/** Igual que getProducts pero incluyendo la descripción — solo para el admin. */
export async function getAdminProducts(
  filters: ProductFilters = {},
): Promise<ProductAdminListItem[]> {
  const { take = 50, skip = 0, sort } = filters

  return db.product.findMany({
    where: buildWhere(filters),
    select: PRODUCT_ADMIN_LIST_SELECT,
    orderBy: buildOrderBy(sort),
    take,
    skip,
  }) as Promise<ProductAdminListItem[]>
}

async function fetchFeaturedProducts(take = 8): Promise<ProductListItem[]> {
  return db.product.findMany({
    where: {
      deletedAt: null,
      featured: true,
      status: 'AVAILABLE',
      inventory: { availableStock: { gt: 0 } },
    },
    select: PRODUCT_LIST_SELECT,
    orderBy: { createdAt: 'desc' },
    take,
  }) as Promise<ProductListItem[]>
}

export const getFeaturedProducts = cache(
  cachedQuery(fetchFeaturedProducts, ['featured-products'], {
    ...PRODUCT_CACHE_OPTIONS,
    revive: reviveProducts,
  }),
)

async function fetchNewProducts(take = 6, hideOutOfStock = false): Promise<ProductListItem[]> {
  return db.product.findMany({
    where: {
      deletedAt: null,
      status: 'AVAILABLE',
      ...(hideOutOfStock ? { inventory: { availableStock: { gt: 0 } } } : {}),
    },
    select: PRODUCT_LIST_SELECT,
    orderBy: { createdAt: 'desc' },
    take,
  }) as Promise<ProductListItem[]>
}

export const getNewProducts = cache(
  cachedQuery(fetchNewProducts, ['new-products'], {
    ...PRODUCT_CACHE_OPTIONS,
    revive: reviveProducts,
  }),
)

async function fetchProductBySlug(slug: string): Promise<ProductDetail | null> {
  return db.product.findFirst({
    where: { slug, deletedAt: null },
    select: PRODUCT_DETAIL_SELECT,
  }) as Promise<ProductDetail | null>
}

/**
 * Ficha pública. La leen generateMetadata y la página: `cache()` evita la
 * segunda consulta y `unstable_cache` las de requests siguientes.
 */
export const getProductBySlug = cache(
  cachedQuery(fetchProductBySlug, ['product-by-slug'], {
    ...PRODUCT_CACHE_OPTIONS,
    revive: (p) => (p ? reviveProduct(p) : null),
  }),
)

async function fetchProductById(id: string): Promise<ProductDetail | null> {
  return db.product.findFirst({
    where: { id, deletedAt: null },
    select: PRODUCT_DETAIL_SELECT,
  }) as Promise<ProductDetail | null>
}

export const getProductById = cache(fetchProductById)
