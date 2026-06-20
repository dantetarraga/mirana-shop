export type BrandRow = {
  id: string
  name: string
  slug: string
  tagline: string | null
  description: string | null
  imageUrl: string | null
  productCount: number
}

export type CreateBrandInput = {
  name: string
  slug: string
  tagline?: string
  description?: string
  imageUrl?: string
}

export type UpdateBrandInput = Partial<CreateBrandInput>

export interface BrandFilters {
  search?: string
  page?: number
  perPage?: number
}
