export type CategoryRow = {
  id: string
  name: string
  slug: string
  parentId: string | null
  description: string | null
  imageUrl: string | null
  productCount: number
}

export type CreateCategoryInput = {
  name: string
  slug: string
  parentId?: string
  description?: string
  imageUrl?: string
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>

export interface CategoryFilters {
  search?: string
  page?: number
  perPage?: number
}
