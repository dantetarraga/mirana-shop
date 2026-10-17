export type BrandRow = {
  id: string
  name: string
  slug: string
  tagline: string | null
  description: string | null
  /** Logo. */
  imageUrl: string | null
  /** Imagen ancha de cabecera de /marcas/[slug]. */
  heroUrl: string | null
  /** Orden manual. */
  position: number
  /** false = oculta en toda la tienda. */
  isVisible: boolean
  /** Logo en el mega-menú (máx. MENU_MAX_FEATURED_BRANDS). */
  featured: boolean
  /**
   * En el admin cuenta todos los productos no borrados; en los listados
   * públicos solo los estados visibles del catálogo.
   */
  productCount: number
}

export type CreateBrandInput = {
  name: string
  slug: string
  tagline?: string
  description?: string
  imageUrl?: string
  heroUrl?: string
  isVisible?: boolean
  featured?: boolean
}

export type UpdateBrandInput = Partial<CreateBrandInput>

export interface BrandFilters {
  search?: string
  page?: number
  perPage?: number
}

// ---------------------------------------------------------------------------
// Tienda
// ---------------------------------------------------------------------------

/** Marca pública: visible, no borrada, conteo público. href = `/marcas/${slug}`. */
export type PublicBrand = BrandRow

export interface PublicBrandsOptions {
  /** Solo las destacadas (logos del mega-menú). */
  featuredOnly?: boolean
}

export interface BrandCategoryLink {
  id: string
  name: string
  slug: string
  parentId: string | null
  /** Productos públicos de la marca en esa categoría (directos). */
  productCount: number
}

export interface BrandPageData {
  brand: PublicBrand
  /** Categorías visibles donde la marca tiene productos públicos, por cantidad desc. */
  categories: BrandCategoryLink[]
}
