import { getPublicBrands } from '@/features/brands/queries/brand.queries'
import { totalsWithDescendants } from '@/features/categories/lib/category-tree'
import { getPublicCategories } from '@/features/categories/queries/category.queries'
import { cachedQuery, CACHE_TAGS, REVALIDATE_LONG } from '@/shared/lib/data-cache'
import { db } from '@/shared/lib/db'
import { getSiteUrl } from '@/shared/lib/env'
import type { MetadataRoute } from 'next'

// Se genera al pedirlo, no en el build: con `revalidate` Next lo pre-renderizaba
// durante `next build`, y el build pasaba a necesitar la base de datos (en el
// hosting, la de producción). Las lecturas van en la caché de datos con los
// tags del catálogo, así que la BD se consulta a lo sumo una vez por hora y
// no en cada visita de un crawler.
export const dynamic = 'force-dynamic'

const LEGAL_SLUGS = ['terminos-y-condiciones', 'politica-de-privacidad'] as const

type Dated = { slug: string; updatedAt: string }

/** Fechas como ISO: la caché de datos serializa a JSON. */
const toDated = (rows: { slug: string; updatedAt: Date }[]): Dated[] =>
  rows.map((r) => ({ slug: r.slug, updatedAt: r.updatedAt.toISOString() }))

const getSitemapRows = cachedQuery(
  async () => {
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
    return {
      products: toDated(products),
      collections: toDated(collections),
      legalPages: toDated(legalPages),
      latestProduct: latestProduct?.updatedAt.toISOString() ?? null,
    }
  },
  ['sitemap-rows'],
  {
    tags: [CACHE_TAGS.products, CACHE_TAGS.catalog, CACHE_TAGS.collections],
    revalidate: REVALIDATE_LONG,
  },
)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE_URL = getSiteUrl()
  const [rows, categories, brands] = await Promise.all([
    getSitemapRows(),
    // Taxonomía pública (visibles, padre visible, conteos públicos): las
    // mismas queries cacheadas que pintan la tienda.
    getPublicCategories(),
    getPublicBrands(),
  ])
  const { products, collections, legalPages } = rows

  const catalogModified = rows.latestProduct ? new Date(rows.latestProduct) : undefined
  const legalModified = new Map(legalPages.map((p) => [p.slug, new Date(p.updatedAt)]))

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
    {
      url: `${BASE_URL}/marcas`,
      lastModified: catalogModified,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    // Página obligatoria (Ley 29571): pública e indexable.
    { url: `${BASE_URL}/libro-de-reclamaciones`, changeFrequency: 'yearly', priority: 0.3 },
  ]

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/catalogo/${p.slug}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const collectionPages: MetadataRoute.Sitemap = collections.map((c) => ({
    url: `${BASE_URL}/colecciones/${c.slug}`,
    lastModified: new Date(c.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  // Solo categorías con productos públicos (contando subcategorías) y marcas
  // con productos: una página vacía no aporta nada al índice.
  const categoryTotals = totalsWithDescendants(categories, (c) => c.productCount)
  const categoryPages: MetadataRoute.Sitemap = categories
    .filter((c) => (categoryTotals.get(c.id) ?? 0) > 0)
    .map((c) => ({
      url: `${BASE_URL}/categorias/${c.slug}`,
      lastModified: catalogModified,
      changeFrequency: 'daily',
      priority: c.parentId ? 0.7 : 0.8,
    }))

  const brandPages: MetadataRoute.Sitemap = brands
    .filter((b) => b.productCount > 0)
    .map((b) => ({
      url: `${BASE_URL}/marcas/${b.slug}`,
      lastModified: catalogModified,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

  return [...staticPages, ...categoryPages, ...brandPages, ...collectionPages, ...productPages]
}
