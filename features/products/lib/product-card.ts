import type { CatalogProduct } from '@/features/products/types/catalog.types'
import type { ProductListItem } from '@/features/products/types'

/**
 * Convierte un ProductListItem (con Decimal de Prisma) a un CatalogProduct
 * serializable como prop de Server Component a Client Component.
 * Los Decimal de Prisma NO son serializables directamente — se convierten a number.
 */
export function toProductCard(product: ProductListItem): CatalogProduct {
  return {
    id: product.id,
    sku: product.sku,
    slug: product.slug,
    name: product.name,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    status: product.status,
    featured: product.featured,
    createdAt: product.createdAt,
    category: product.category,
    brand: product.brand,
    imageUrl: product.images[0]?.url ?? null,
    stock: product.inventory?.availableStock ?? 0,
  }
}

export function toProductCards(products: ProductListItem[]): CatalogProduct[] {
  return products.map(toProductCard)
}
