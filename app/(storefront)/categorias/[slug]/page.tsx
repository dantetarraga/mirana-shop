import { getCategoryPageData } from '@/features/categories/queries/category.queries'
import { CatalogBrowser } from '@/features/products/components/CatalogBrowser'
import { parseCatalogParams, type RawCatalogSearchParams } from '@/features/products/lib/catalog-params'
import { JsonLd } from '@/shared/components/JsonLd'
import { Breadcrumbs, breadcrumbJsonLd } from '@/shared/components/layout/Breadcrumbs'
import { PageHero } from '@/shared/components/layout/PageHero'
import { ChipLink, ChipRow } from '@/shared/components/ui/ChipLink'
import { getSiteUrl } from '@/shared/lib/env'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

// Sin generateStaticParams: el layout de la tienda lee cookies (carrito,
// sesión), así que la ruta es dinámica igual; los datos salen de la caché.

const META_DESCRIPTION_MAX = 160

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<RawCatalogSearchParams>
}

const productsLabel = (n: number) => `${n} ${n === 1 ? 'producto' : 'productos'}`

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const data = await getCategoryPageData(slug)
  if (!data) return { title: 'Categoría no encontrada', robots: { index: false } }

  const { category, ancestors } = data
  const parent = ancestors.at(-1)
  const title = parent ? `${category.name} · ${parent.name}` : category.name
  const text =
    category.description?.trim() ||
    `${title}: ${productsLabel(category.productCount)} en MIRANA, tienda de figuras y coleccionables en Perú.`
  const description =
    text.length > META_DESCRIPTION_MAX ? `${text.slice(0, META_DESCRIPTION_MAX - 1).trimEnd()}…` : text
  const url = `/categorias/${category.slug}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title,
      description,
      url,
      images: category.imageUrl ? [{ url: category.imageUrl, alt: category.name }] : undefined,
    },
    twitter: { card: category.imageUrl ? 'summary_large_image' : 'summary', title, description },
  }
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const [{ slug }, raw] = await Promise.all([params, searchParams])
  const data = await getCategoryPageData(slug)
  if (!data) notFound()

  const { category, ancestors } = data
  const parent = ancestors.at(-1)
  // En una subcategoría los chips son sus hermanas (bajo "Todo {Padre}").
  const family = parent ? await getCategoryPageData(parent.slug) : data
  const chipsRoot = family?.category ?? category
  const chips = (family?.children ?? []).filter((c) => c.productCount > 0 || c.slug === category.slug)

  const siteUrl = getSiteUrl()
  const path = `/categorias/${category.slug}`
  const crumbs = [
    { label: 'Inicio', path: '/' },
    ...ancestors.map((a) => ({ label: a.name, path: `/categorias/${a.slug}` })),
    { label: category.name, path },
  ]

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: parent ? `${parent.name} ${category.name}` : category.name,
    description: category.description || undefined,
    url: `${siteUrl}${path}`,
    image: category.imageUrl || undefined,
    isPartOf: { '@type': 'WebSite', name: 'MIRANA', url: siteUrl },
    mainEntity: { '@type': 'ItemList', numberOfItems: category.productCount },
  }

  return (
    <>
      <JsonLd data={collectionJsonLd} />
      <JsonLd data={breadcrumbJsonLd(siteUrl, crumbs)} />

      <section className="shell pb-20 pt-8 sm:pt-10">
        <Breadcrumbs
          items={crumbs.map((c, i) => ({
            label: c.label,
            href: i < crumbs.length - 1 ? c.path : undefined,
          }))}
        />

        <PageHero
          title={category.name}
          description={category.description}
          imageUrl={category.imageUrl}
          meta={parent ? `${parent.name} · ${productsLabel(category.productCount)}` : productsLabel(category.productCount)}
        />

        {chips.length > 0 && (
          <ChipRow label={`Subcategorías de ${chipsRoot.name}`} className="mb-8">
            <li className="snap-start">
              <ChipLink
                href={`/categorias/${chipsRoot.slug}`}
                active={chipsRoot.slug === category.slug}
                count={chipsRoot.productCount}
              >
                Todo {chipsRoot.name}
              </ChipLink>
            </li>
            {chips.map((c) => (
              <li key={c.id} className="snap-start">
                <ChipLink href={`/categorias/${c.slug}`} active={c.slug === category.slug} count={c.productCount}>
                  {c.name}
                </ChipLink>
              </li>
            ))}
          </ChipRow>
        )}

        <h2 className="sr-only">Productos de {category.name}</h2>
        <CatalogBrowser
          params={parseCatalogParams(raw)}
          basePath={path}
          scope={{ categorySlug: category.slug }}
          showBrandFilter
          emptyScopeText={`Todavía no hay productos en ${category.name}. Vuelve pronto o explora el catálogo.`}
        />
      </section>
    </>
  )
}
