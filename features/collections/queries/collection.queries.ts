import 'server-only'
import { cachedQuery, CACHE_TAGS, REVALIDATE_SHORT, reviveDate } from '@/shared/lib/data-cache'
import { db } from '@/shared/lib/db'
import { DEFAULT_CATALOG_STATUSES } from '@/features/products/lib/availability'
import { PRODUCT_LIST_SELECT, reviveProducts } from '@/features/products/queries/product.queries'
import { cache } from 'react'
import type { ProductListItem } from '@/features/products/types'
import type {
  CatalogCollection,
  CollectionFilters,
  CollectionRow,
  CollectionWithProducts,
} from '@/features/collections/types'

export const COLLECTION_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  imageUrl: true,
  active: true,
  createdAt: true,
  _count: {
    select: {
      products: {
        where: {
          product: { deletedAt: null },
        },
      },
    },
  },
} as const

export function mapCollectionRow(c: {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  active: boolean
  createdAt: Date
  _count: { products: number }
}): CollectionRow {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    imageUrl: c.imageUrl,
    active: c.active,
    createdAt: c.createdAt,
    productCount: c._count.products,
  }
}

async function fetchCollections(filters: CollectionFilters = {}): Promise<CollectionRow[]> {
  const { search, active, page = 1, perPage = 50 } = filters
  const skip = (page - 1) * perPage

  const rows = await db.collection.findMany({
    where: {
      deletedAt: null,
      ...(active !== undefined && { active }),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { slug: { contains: search } },
            ],
          }
        : {}),
    },
    select: COLLECTION_SELECT,
    orderBy: { name: 'asc' },
    skip,
    take: perPage,
  })

  return rows.map(mapCollectionRow)
}

// Las colecciones públicas mezclan datos de la colección y de sus productos
// (precio "desde", conteo, stock), así que se invalidan con los tres tags:
// las actions de enlazar productos solo disparan 'products'.
const COLLECTION_CACHE_OPTIONS = {
  tags: [CACHE_TAGS.collections, CACHE_TAGS.products, CACHE_TAGS.catalog],
  revalidate: REVALIDATE_SHORT,
}

/** Forma exacta del listado público: la piden la home y el layout de la tienda. */
const PUBLIC_COLLECTIONS_FILTERS: CollectionFilters = { active: true, perPage: 50 }
const PUBLIC_COLLECTIONS_KEY = JSON.stringify(PUBLIC_COLLECTIONS_FILTERS)

const getCollectionsByKey = cache((key: string) =>
  // El listado público va a la caché entre requests; cualquier otro (admin,
  // búsqueda, actions) se lee fresco.
  key === PUBLIC_COLLECTIONS_KEY ? getPublicCollectionRows() : fetchCollections(JSON.parse(key) as CollectionFilters),
)

/** Listado del admin y las actions: solo deduplicado por request. */
export function getCollections(filters: CollectionFilters = {}): Promise<CollectionRow[]> {
  return getCollectionsByKey(JSON.stringify(filters))
}

/** Colecciones activas para los filtros rápidos del inicio — cacheado entre requests. */
export const getPublicCollectionRows = cache(
  cachedQuery(() => fetchCollections(PUBLIC_COLLECTIONS_FILTERS), ['public-collection-rows'], {
    ...COLLECTION_CACHE_OPTIONS,
    revive: (rows) => rows.map((c) => ({ ...c, createdAt: reviveDate(c.createdAt) })),
  }),
)

export async function countCollections(
  filters: Pick<CollectionFilters, 'search' | 'active'> = {},
): Promise<number> {
  const { search, active } = filters
  return db.collection.count({
    where: {
      deletedAt: null,
      ...(active !== undefined && { active }),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { slug: { contains: search } },
            ],
          }
        : {}),
    },
  })
}

export async function getCollectionBySlug(slug: string): Promise<CollectionWithProducts | null> {
  const c = await db.collection.findFirst({
    where: { slug, deletedAt: null },
    select: {
      ...COLLECTION_SELECT,
      products: {
        where: { product: { deletedAt: null } },
        select: {
          productId: true,
          product: { select: { name: true, sku: true } },
        },
      },
    },
  })
  if (!c) return null
  return {
    ...mapCollectionRow(c),
    products: c.products.map((p) => ({
      productId: p.productId,
      name: p.product.name,
      sku: p.product.sku,
    })),
  }
}

export async function getCollectionById(id: string): Promise<CollectionWithProducts | null> {
  const c = await db.collection.findFirst({
    where: { id, deletedAt: null },
    select: {
      ...COLLECTION_SELECT,
      products: {
        where: { product: { deletedAt: null } },
        select: {
          productId: true,
          product: { select: { name: true, sku: true } },
        },
      },
    },
  })
  if (!c) return null
  return {
    ...mapCollectionRow(c),
    products: c.products.map((p) => ({
      productId: p.productId,
      name: p.product.name,
      sku: p.product.sku,
    })),
  }
}

// ---------------------------------------------------------------------------
// Vista pública
//
// Una colección solo se muestra en la web si está activa y le queda al menos
// un producto visible. El filtro de productos replica el del catálogo
// (`buildWhere` en product.queries) para que lo que se promete en la card sea
// exactamente lo que se ve al entrar.
// ---------------------------------------------------------------------------

function publicProductWhere(hideOutOfStock: boolean) {
  return {
    deletedAt: null,
    status: { in: DEFAULT_CATALOG_STATUSES },
    ...(hideOutOfStock
      ? {
          NOT: { status: 'SOLD_OUT' as const },
          OR: [
            { status: 'PREORDER' as const },
            { inventory: { availableStock: { gt: 0 } } },
          ],
        }
      : {}),
  }
}

/** Precio que paga el cliente: la oferta si mejora el precio base. */
function effectivePrice(price: unknown, salePrice: unknown): number {
  const base = Number(price)
  const sale = salePrice != null ? Number(salePrice) : null
  return sale != null && sale < base ? sale : base
}

/**
 * Colecciones activas para el catálogo. Trae de cada producto solo lo mínimo
 * para calcular el conteo, el precio "desde" y la imagen de respaldo.
 */
async function fetchPublicCollections(hideOutOfStock = false): Promise<CatalogCollection[]> {
  const rows = await db.collection.findMany({
    where: { deletedAt: null, active: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      products: {
        where: { product: publicProductWhere(hideOutOfStock) },
        select: {
          product: {
            select: {
              price: true,
              salePrice: true,
              images: { select: { url: true }, orderBy: { position: 'asc' }, take: 1 },
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return rows
    .filter((c) => c.products.length > 0)
    .map((c) => {
      const prices = c.products.map((p) => effectivePrice(p.product.price, p.product.salePrice))
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        imageUrl: c.imageUrl || (c.products.find((p) => p.product.images[0])?.product.images[0]?.url ?? null),
        productCount: c.products.length,
        fromPrice: prices.length > 0 ? Math.min(...prices) : null,
      }
    })
}

/** Solo primitivos: se cachea sin revividor. */
export const getPublicCollections = cache(
  cachedQuery(fetchPublicCollections, ['public-collections'], COLLECTION_CACHE_OPTIONS),
)

export type PublicCollectionDetail = CatalogCollection & {
  products: ProductListItem[]
}

/** Colección + sus productos visibles, para la página pública. */
async function fetchPublicCollectionBySlug(
  slug: string,
  hideOutOfStock = false,
): Promise<PublicCollectionDetail | null> {
  const c = await db.collection.findFirst({
    where: { slug, deletedAt: null, active: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      products: {
        where: { product: publicProductWhere(hideOutOfStock) },
        select: { product: { select: PRODUCT_LIST_SELECT } },
        orderBy: { product: { name: 'asc' } },
      },
    },
  })
  if (!c) return null

  const products = c.products.map((p) => p.product) as ProductListItem[]
  const prices = products.map((p) => effectivePrice(p.price, p.salePrice))

  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    imageUrl: c.imageUrl || (products.find((p) => p.images[0])?.images[0]?.url ?? null),
    productCount: products.length,
    fromPrice: prices.length > 0 ? Math.min(...prices) : null,
    products,
  }
}

/**
 * La leen generateMetadata y la página: `cache()` evita la segunda consulta
 * del mismo request y `unstable_cache` las de requests siguientes.
 */
export const getPublicCollectionBySlug = cache(
  cachedQuery(fetchPublicCollectionBySlug, ['public-collection-by-slug'], {
    ...COLLECTION_CACHE_OPTIONS,
    revive: (c) => (c ? { ...c, products: reviveProducts(c.products) } : null),
  }),
)
