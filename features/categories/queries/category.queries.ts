import 'server-only'
import { sortAsTree } from '@/features/categories/lib/category-tree'
import {
  buildCategoryPageData,
  buildMenuTree,
  filterPublicNodes,
} from '@/features/categories/lib/menu-tree'
import type {
  AdminCategoryRow,
  CategoryFilters,
  CategoryPageData,
  CategoryRow,
  MenuCategory,
} from '@/features/categories/types'
import { DEFAULT_CATALOG_STATUSES } from '@/features/products/lib/availability'
import { cachedQuery, CACHE_TAGS, REVALIDATE_LONG } from '@/shared/lib/data-cache'
import { db } from '@/shared/lib/db'
import { cache } from 'react'

const BASE_SELECT = {
  id: true,
  name: true,
  slug: true,
  parentId: true,
  description: true,
  imageUrl: true,
  position: true,
  isVisible: true,
  showInMenu: true,
} as const

/** Admin: cuenta todos los productos no borrados (cualquier estado). */
export const CATEGORY_SELECT = {
  ...BASE_SELECT,
  _count: { select: { products: { where: { deletedAt: null } } } },
} as const

/** Tienda: solo los estados que el catálogo público muestra. */
const PUBLIC_PRODUCT_WHERE = {
  deletedAt: null,
  status: { in: DEFAULT_CATALOG_STATUSES },
}

const PUBLIC_CATEGORY_SELECT = {
  ...BASE_SELECT,
  _count: { select: { products: { where: PUBLIC_PRODUCT_WHERE } } },
} as const

type CategoryWithCount = {
  id: string
  name: string
  slug: string
  parentId: string | null
  description: string | null
  imageUrl: string | null
  position: number
  isVisible: boolean
  showInMenu: boolean
  _count: { products: number }
}

export function mapCategoryRow(c: CategoryWithCount): CategoryRow {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    parentId: c.parentId,
    description: c.description,
    imageUrl: c.imageUrl,
    position: c.position,
    isVisible: c.isVisible,
    showInMenu: c.showInMenu,
    productCount: c._count.products,
  }
}

function searchWhere(search?: string) {
  return {
    deletedAt: null,
    ...(search
      ? { OR: [{ name: { contains: search } }, { slug: { contains: search } }] }
      : {}),
  }
}

// ---------------------------------------------------------------------------
// Admin / actions / buscador — lectura fresca
// ---------------------------------------------------------------------------

async function fetchCategories(filters: CategoryFilters = {}): Promise<CategoryRow[]> {
  const { search, page = 1, perPage = 50 } = filters
  const categories = await db.category.findMany({
    where: searchWhere(search),
    select: CATEGORY_SELECT,
    orderBy: [{ position: 'asc' }, { name: 'asc' }],
    skip: (page - 1) * perPage,
    take: perPage,
  })
  return categories.map(mapCategoryRow)
}

/**
 * Forma histórica del listado público (`perPage: 50`): la piden el menú
 * móvil y el buscador. Se redirige a getPublicCategories (sin tope, conteos
 * públicos, solo visibles).
 */
const PUBLIC_CATEGORIES_KEY = JSON.stringify({ perPage: 50 } satisfies CategoryFilters)

const getCategoriesByKey = cache((key: string) =>
  key === PUBLIC_CATEGORIES_KEY
    ? getPublicCategories()
    : fetchCategories(JSON.parse(key) as CategoryFilters),
)

/**
 * Listado (admin, actions, buscador): solo deduplicado por request — `cache()`
 * compara por identidad, por eso la clave es el JSON de los filtros.
 */
export function getCategories(filters: CategoryFilters = {}): Promise<CategoryRow[]> {
  return getCategoriesByKey(JSON.stringify(filters))
}

export async function countCategories(
  filters: Pick<CategoryFilters, 'search'> = {},
): Promise<number> {
  return db.category.count({ where: searchWhere(filters.search) })
}

/**
 * Árbol completo del admin (sin paginar), en preorden. Trae el conteo del
 * admin (todo lo no borrado) y el público (para la vista previa del menú).
 */
export async function getAdminCategoryTree(): Promise<AdminCategoryRow[]> {
  const [categories, publicCounts] = await Promise.all([
    db.category.findMany({ where: { deletedAt: null }, select: CATEGORY_SELECT }),
    db.product.groupBy({
      by: ['categoryId'],
      where: PUBLIC_PRODUCT_WHERE,
      _count: { _all: true },
    }),
  ])
  const publicById = new Map(publicCounts.map((g) => [g.categoryId, g._count._all]))
  const rows = categories.map((c) => ({
    ...mapCategoryRow(c),
    publicProductCount: publicById.get(c.id) ?? 0,
  }))
  return sortAsTree(rows)
}

/** Categoría viva por slug (admin/actions). */
export async function findCategoryBySlug(slug: string): Promise<CategoryRow | null> {
  const c = await db.category.findFirst({
    where: { slug, deletedAt: null },
    select: CATEGORY_SELECT,
  })
  return c ? mapCategoryRow(c) : null
}

/** Categoría viva por id (admin/actions). */
export async function findCategoryById(id: string): Promise<CategoryRow | null> {
  const c = await db.category.findFirst({
    where: { id, deletedAt: null },
    select: CATEGORY_SELECT,
  })
  return c ? mapCategoryRow(c) : null
}

// ---------------------------------------------------------------------------
// Tienda — caché entre requests
//
// Una sola consulta cacheada (todas las categorías visibles con su conteo
// público directo) alimenta el listado público, el mega-menú y las páginas de
// categoría: los derivados se calculan en memoria (features/categories/lib/
// menu-tree.ts). La invalidan 'categories' (actions de categorías), 'catalog'
// y 'products' (las de productos cambian los conteos).
// ---------------------------------------------------------------------------

async function fetchPublicCategoryNodes(): Promise<CategoryRow[]> {
  const rows = await db.category.findMany({
    where: { deletedAt: null, isVisible: true },
    select: PUBLIC_CATEGORY_SELECT,
  })
  return filterPublicNodes(rows.map(mapCategoryRow))
}

const getPublicCategoryNodes = cache(
  cachedQuery(fetchPublicCategoryNodes, ['public-category-nodes'], {
    tags: [CACHE_TAGS.categories, CACHE_TAGS.catalog, CACHE_TAGS.products],
    revalidate: REVALIDATE_LONG,
  }),
)

/**
 * Listado público (inicio, filtros del catálogo, menú móvil): todas las
 * categorías visibles —sin tope— en preorden del árbol (raíz, sus hijas…).
 * `productCount` es el conteo público DIRECTO (sin descendientes).
 */
export const getPublicCategories = cache(
  async (): Promise<CategoryRow[]> => getPublicCategoryNodes(),
)

/**
 * Mega-menú y menú móvil: raíces con `showInMenu` y sus subcategorías, por
 * `position`, con conteo público incluyendo descendientes. Omite las vacías.
 * No aplica límites de columnas: ver features/categories/lib/menu-limits.ts.
 */
export const getMenuTree = cache(
  async (): Promise<MenuCategory[]> => buildMenuTree(await getPublicCategoryNodes()),
)

/**
 * /categorias/[slug]: categoría, migas, subcategorías con conteo y los ids
 * (propia + descendientes) para filtrar productos. null si no existe, está
 * oculta (ella o su padre) o en la papelera → notFound().
 */
export const getCategoryPageData = cache(
  async (slug: string): Promise<CategoryPageData | null> =>
    buildCategoryPageData(await getPublicCategoryNodes(), slug),
)
