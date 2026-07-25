import { db } from '@/shared/lib/db'
import type { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, collections] = await Promise.all([
    db.product.findMany({
      where: { deletedAt: null, status: { not: 'ARCHIVED' } },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 5000,
    }),
    db.collection.findMany({
      where: { deletedAt: null, active: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 1000,
    }),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/catalogo`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/terminos-y-condiciones`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/politica-de-privacidad`, changeFrequency: 'monthly', priority: 0.3 },
  ]

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/catalogo/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const collectionPages: MetadataRoute.Sitemap = collections.map((c) => ({
    url: `${BASE_URL}/colecciones/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticPages, ...collectionPages, ...productPages]
}
