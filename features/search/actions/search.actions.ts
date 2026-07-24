'use server'

import { getCategories } from '@/features/categories/queries/category.queries'
import type { CategoryRow } from '@/features/categories/types'
import { toProductCards } from '@/features/products/lib/product-card'
import { countProducts, getProducts } from '@/features/products/queries/product.queries'
import type { CatalogProduct } from '@/features/products/types/catalog.types'
import { getHideOutOfStock } from '@/features/settings/queries/store-settings.queries'

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

async function getPopularCategories(take: number): Promise<CategoryRow[]> {
  const allCategories = await getCategories({ perPage: 50 })
  return allCategories
    .slice()
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, take)
}

export async function getSearchSuggestions(rawQuery: string): Promise<SearchSuggestions> {
  const query = rawQuery.trim()

  if (query.length < MIN_QUERY_LENGTH) {
    return {
      query: '',
      products: [],
      categories: await getPopularCategories(POPULAR_CATEGORIES_TAKE),
      total: 0,
    }
  }

  const hideOutOfStock = await getHideOutOfStock()

  const [products, matchingCategories, total] = await Promise.all([
    getProducts({ search: query, hideOutOfStock, take: PRODUCT_SUGGESTIONS_TAKE }),
    getCategories({ search: query, perPage: MATCHING_CATEGORIES_TAKE }),
    countProducts({ search: query, hideOutOfStock }),
  ])

  // Sin coincidencias de producto: usar categorías populares como sugerencia de
  // recuperación en vez de categorías que tampoco matchearon el término.
  const categories = total === 0 ? await getPopularCategories(POPULAR_CATEGORIES_TAKE) : matchingCategories

  return {
    query,
    products: toProductCards(products),
    categories,
    total,
  }
}
