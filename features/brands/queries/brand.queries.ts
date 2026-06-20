import 'server-only'
import { db } from '@/shared/lib/db'
import type { BrandFilters, BrandRow } from '@/features/brands/types'

export const BRAND_SELECT = {
  id: true,
  name: true,
  slug: true,
  tagline: true,
  description: true,
  imageUrl: true,
  _count: { select: { products: { where: { deletedAt: null } } } },
} as const

export function mapBrandRow(b: {
  id: string
  name: string
  slug: string
  tagline: string | null
  description: string | null
  imageUrl: string | null
  _count: { products: number }
}): BrandRow {
  return {
    id: b.id,
    name: b.name,
    slug: b.slug,
    tagline: b.tagline,
    description: b.description,
    imageUrl: b.imageUrl,
    productCount: b._count.products,
  }
}

export async function getBrands(filters: BrandFilters = {}): Promise<BrandRow[]> {
  const { search, page = 1, perPage = 50 } = filters
  const skip = (page - 1) * perPage

  const brands = await db.brand.findMany({
    where: {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { slug: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    select: BRAND_SELECT,
    orderBy: { name: 'asc' },
    skip,
    take: perPage,
  })

  return brands.map(mapBrandRow)
}

export async function countBrands(filters: Pick<BrandFilters, 'search'> = {}): Promise<number> {
  const { search } = filters
  return db.brand.count({
    where: {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { slug: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
  })
}

export async function getBrandBySlug(slug: string): Promise<BrandRow | null> {
  const b = await db.brand.findFirst({ where: { slug, deletedAt: null }, select: BRAND_SELECT })
  return b ? mapBrandRow(b) : null
}

export async function getBrandById(id: string): Promise<BrandRow | null> {
  const b = await db.brand.findFirst({ where: { id, deletedAt: null }, select: BRAND_SELECT })
  return b ? mapBrandRow(b) : null
}
