import { db } from '@/shared/lib/db'
import { getSiteUrl } from '@/shared/lib/env'
import type { MetadataRoute } from 'next'

// Antes era force-dynamic: cada crawler que pedía el sitemap costaba dos
// consultas pesadas a la BD. Una vez por hora basta para un catálogo.
export const revalidate = 3600

const LEGAL_SLUGS = ['terminos-y-condiciones', 'politica-de-privacidad'] as const

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE_URL = getSiteUrl()
  const [products, collections, legalPages, latestProduct] = await Promise.all([
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
    db.legalPage.findMany({
      where: { slug: { in: [...LEGAL_SLUGS] } },
      select: { slug: true, updatedAt: true },
    }),
    // Fecha de la última edición del catálogo: sirve de lastModified para el
    // inicio y /catalogo, que listan productos.
    db.product.findFirst({
      where: { deletedAt: null },
      select: { updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    }),
  ])

  const catalogModified = latestProduct?.updatedAt
  const legalModified = new Map(legalPages.map((p) => [p.slug, p.updatedAt]))

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: catalogModified, changeFrequency: 'daily', priority: 1 },
    {
      url: `${BASE_URL}/catalogo`,
      lastModified: catalogModified,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...LEGAL_SLUGS.map((slug) => ({
      url: `${BASE_URL}/${slug}`,
      lastModified: legalModified.get(slug),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    })),
    // Página obligatoria (Ley 29571): pública e indexable.
    { url: `${BASE_URL}/libro-de-reclamaciones`, changeFrequency: 'yearly', priority: 0.3 },
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
