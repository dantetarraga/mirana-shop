export type CategoryRow = {
  id: string
  name: string
  slug: string
  parentId: string | null
  description: string | null
  imageUrl: string | null
  /** Orden entre hermanas. */
  position: number
  /** false = oculta en toda la tienda. */
  isVisible: boolean
  /** Solo raíces: entra al mega-menú. */
  showInMenu: boolean
  /**
   * Productos DIRECTOS (sin descendientes). En el admin cuenta todos los no
   * borrados; en los listados públicos solo los estados visibles del catálogo.
   */
  productCount: number
}

/** Fila del árbol del admin: conteo del admin + conteo público (para la vista previa). */
export type AdminCategoryRow = CategoryRow & {
  /** Productos directos en estados visibles del catálogo. */
  publicProductCount: number
}

export type CreateCategoryInput = {
  name: string
  slug: string
  parentId?: string | null
  description?: string
  imageUrl?: string
  isVisible?: boolean
  showInMenu?: boolean
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>

export interface CategoryFilters {
  search?: string
  page?: number
  perPage?: number
}

/** Un movimiento del árbol del admin (reorderCategories). */
export interface CategoryMove {
  id: string
  parentId: string | null
  position: number
}

// ---------------------------------------------------------------------------
// Tienda (mega-menú, menú móvil, /categorias/[slug])
//
// Todos los conteos son PÚBLICOS: solo productos no borrados en
// DEFAULT_CATALOG_STATUSES (disponible, preventa, agotado).
// ---------------------------------------------------------------------------

/** Referencia mínima para migas y enlaces: href = `/categorias/${slug}`. */
export interface CategoryLink {
  id: string
  name: string
  slug: string
}

export interface MenuSubcategory extends CategoryLink {
  /** Productos públicos (incluye descendientes). Siempre > 0. */
  productCount: number
}

export interface MenuCategory extends CategoryLink {
  imageUrl: string | null
  /** Productos públicos propios + de sus subcategorías. Siempre > 0. */
  productCount: number
  /** Subcategorías visibles con productos, ordenadas por `position`. Sin límite: el mega-menú aplica MENU_MAX_CHILDREN. */
  children: MenuSubcategory[]
}

export interface CategoryPageChild extends CategoryLink {
  imageUrl: string | null
  /** Productos públicos (incluye descendientes). Puede ser 0. */
  productCount: number
}

export interface CategoryPageData {
  category: CategoryLink & {
    parentId: string | null
    description: string | null
    imageUrl: string | null
    /** Productos públicos propios + descendientes. */
    productCount: number
  }
  /** De la raíz hacia abajo, sin incluir la categoría. Vacío si es raíz. */
  ancestors: CategoryLink[]
  /** Subcategorías visibles ordenadas por `position` (incluye las que tienen 0). */
  children: CategoryPageChild[]
  /** IDs de las descendientes visibles (sin la propia). */
  descendantIds: string[]
  /** La propia + descendientes: listo para `categoryId: { in: categoryIds }`. */
  categoryIds: string[]
}
