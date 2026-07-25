export type CollectionRow = {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  active: boolean
  productCount: number
  createdAt: Date
}

export type CollectionWithProducts = CollectionRow & {
  products: Array<{
    productId: string
    name: string
    sku: string
  }>
}

// ---------------------------------------------------------------------------
// Vista pública — la colección se presenta en el catálogo como una card más
// ---------------------------------------------------------------------------

export type CatalogCollection = {
  id: string
  name: string
  slug: string
  description: string | null
  /** Imagen propia de la colección o, si no tiene, la del primer producto. */
  imageUrl: string | null
  /** Productos visibles al público (respeta el ajuste de ocultar agotados). */
  productCount: number
  /** Precio efectivo más bajo de la colección — el "Desde S/ X" de la card. */
  fromPrice: number | null
}

export type CreateCollectionInput = {
  name: string
  slug: string
  description?: string
  imageUrl?: string
  active?: boolean
}

export type UpdateCollectionInput = Partial<CreateCollectionInput>

export interface CollectionFilters {
  search?: string
  active?: boolean
  page?: number
  perPage?: number
}
