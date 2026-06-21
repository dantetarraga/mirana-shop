'use server'

import { getCategories } from '@/features/categories/queries/category.queries'
import type { CategoryRow } from '@/features/categories/types'
import { toProductCards } from '@/features/products/lib/product-card'
import { countProducts, getProducts } from '@/features/products/queries/product.queries'
import type { CatalogProduct } from '@/features/products/types/catalog.types'

const MIN_QUERY_LENGTH = 2
const PRODUCT_SUGGESTIONS_TAKE = 6
const POPULAR_CATEGORIES_TAKE = 5
const MATCHING_CATEGORIES_TAKE = 3

export type SearchSuggestions = {
  query: string
  products: CatalogProduct[]
  categories: CategoryRow[]
  total: number
}

export async function getSearchSuggestions(rawQuery: string): Promise<SearchSuggestions> {
  const query = rawQuery.trim()

  if (query.length < MIN_QUERY_LENGTH) {
    const allCategories = await getCategories({ perPage: 50 })
    const popularCategories = allCategories
      .slice()
      .sort((a, b) => b.productCount - a.productCount)
      .slice(0, POPULAR_CATEGORIES_TAKE)
    return {
      query: '',
      products: [],
      categories: popularCategories,
      total: 0,
    }
  }

  const [products, categories, total] = await Promise.all([
    getProducts({ search: query, take: PRODUCT_SUGGESTIONS_TAKE }),
    getCategories({ search: query, perPage: MATCHING_CATEGORIES_TAKE }),
    countProducts({ search: query }),
  ])

  return {
    query,
    products: toProductCards(products),
    categories,
    total,
  }
}
