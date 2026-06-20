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
