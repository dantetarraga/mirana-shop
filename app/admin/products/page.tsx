import { ProductsClient } from '@/features/products/components/ProductsClient'
import { brandRepo } from '@/modules/catalog/repositories/brand.repo'
import { categoryRepo } from '@/modules/catalog/repositories/category.repo'
import { collectionRepo } from '@/modules/catalog/repositories/collection.repo'
import { productRepo } from '@/modules/catalog/repositories/product.repo'

const PER_PAGE = 30

interface PageProps {
  searchParams: Promise<{
    q?: string
    cat?: string
    brand?: string
    collection?: string
    page?: string
  }>
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const { q, cat, brand, collection, page: rawPage } = await searchParams
  const page = Math.max(1, Number(rawPage ?? 1))
  const skip = (page - 1) * PER_PAGE

  const categorySlugs  = cat        ? cat.split(',').filter(Boolean)        : []
  const brandSlugs     = brand      ? brand.split(',').filter(Boolean)      : []
  const collectionSlugs = collection ? collection.split(',').filter(Boolean) : []

  const [products, categories, brands, collections, total] = await Promise.all([
    productRepo.findMany({
      search: q,
      categorySlug:  categorySlugs.length  > 0 ? categorySlugs  : undefined,
      brandSlug:     brandSlugs.length     > 0 ? brandSlugs     : undefined,
      collectionSlug: collectionSlugs.length > 0 ? collectionSlugs : undefined,
      status: undefined,
      take: PER_PAGE,
      skip,
    }),
    categoryRepo.findAll(),
    brandRepo.findAll(),
    collectionRepo.findAll({ perPage: 200 }),
    productRepo.count({
      search: q,
      categorySlug:  categorySlugs.length  > 0 ? categorySlugs  : undefined,
      brandSlug:     brandSlugs.length     > 0 ? brandSlugs     : undefined,
      collectionSlug: collectionSlugs.length > 0 ? collectionSlugs : undefined,
      status: undefined,
    }),
  ])

  // Serializar Decimals — todos los campos Decimal deben convertirse
  const serializedProducts = products.map((p) => ({
    ...p,
    price: Number(p.price),
    compareAtPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : null,
    salePrice: p.salePrice != null ? Number(p.salePrice) : null,
  }))

  return (
    <ProductsClient
      initialProducts={serializedProducts}
      categories={categories}
      brands={brands}
      collections={collections}
      total={total}
      currentPage={page}
      perPage={PER_PAGE}
      currentQ={q ?? ''}
      currentCats={categorySlugs}
      currentBrands={brandSlugs}
      currentCollections={collectionSlugs}
    />
  )
}
