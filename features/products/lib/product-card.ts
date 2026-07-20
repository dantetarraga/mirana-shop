import type { ProductListItem } from '@/features/products/types'
import type { CatalogProduct } from '@/features/products/types/catalog.types'
import { Dates } from '@/shared/lib/dates'

const NEW_ARRIVAL_DAYS = 30

export function toProductCard(product: ProductListItem): CatalogProduct {
  return {
    id: product.id,
    sku: product.sku,
    slug: product.slug,
    name: product.name,
    price: Number(product.price),
    salePrice: product.salePrice ? Number(product.salePrice) : null,
    status: product.status,
    featured: product.featured,
    createdAt: product.createdAt,
    isNewArrival:
      product.status === 'AVAILABLE' && Dates.isWithinLastDays(product.createdAt, NEW_ARRIVAL_DAYS),
    category: product.category,
    brand: product.brand,
    imageUrl: product.images[0]?.url ?? null,
    images: product.images.map((img) => ({ url: img.url, alt: img.alt })),
    stock: product.inventory?.availableStock ?? 0,
  }
}

export function toProductCards(products: ProductListItem[]): CatalogProduct[] {
  return products.map(toProductCard)
}
