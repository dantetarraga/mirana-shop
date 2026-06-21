import type { ProductStatus } from '@/generated/prisma/client'
import type { Decimal } from '@/generated/prisma/internal/prismaNamespace'

export type ProductImage = {
  id: string
  url: string
  alt: string | null
  position: number
}

export type ProductListItem = {
  id: string
  sku: string
  slug: string
  name: string
  price: Decimal
  compareAtPrice: Decimal | null
  salePrice: Decimal | null
  status: ProductStatus
  featured: boolean
  createdAt: Date
  category: { id: string; name: string; slug: string }
  brand: { id: string; name: string; slug: string }
  images: ProductImage[]
  inventory: { availableStock: number } | null
  collections: { collection: { id: string; name: string; slug: string } }[]
}

export type ProductDetail = ProductListItem & {
  description: string
  currency: string
  updatedAt: Date
}

export type StockFilter = 'all' | 'low' | 'out'

export type ProductSort = 'relevance' | 'price_asc' | 'price_desc' | 'newest'

export type ProductFilters = {
  categorySlug?: string | string[]
  brandSlug?: string | string[]
  collectionSlug?: string | string[]
  search?: string
  featured?: boolean
  /** Por defecto (clave omitida) solo `AVAILABLE`. Pasar 'ALL' para no filtrar por status. */
  status?: ProductStatus | ProductStatus[] | 'ALL'
  stockFilter?: StockFilter
  priceMin?: number
  priceMax?: number
  sort?: ProductSort
  take?: number
  skip?: number
}

export type CreateProductInput = {
  sku: string
  slug: string
  name: string
  description: string
  price: number
  compareAtPrice?: number
  salePrice?: number
  status?: ProductStatus
  featured?: boolean
  categoryId: string
  brandId: string
  stock?: number
  images?: { url: string; alt?: string; position?: number }[]
}

export type UpdateProductInput = Partial<CreateProductInput> & { id: string }
