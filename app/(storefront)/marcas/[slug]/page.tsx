import { getBrandBySlug } from '@/features/brands/queries/brand.queries'
import { CatalogBrowser } from '@/features/products/components/CatalogBrowser'
import { parseCatalogParams, type RawCatalogSearchParams } from '@/features/products/lib/catalog-params'
import { buildCatalogUrl } from '@/features/products/lib/catalog-url'
import { JsonLd } from '@/shared/components/JsonLd'
import { Breadcrumbs, breadcrumbJsonLd } from '@/shared/components/layout/Breadcrumbs'
import { PageHero } from '@/shared/components/layout/PageHero'
import { ChipLink, ChipRow } from '@/shared/components/ui/ChipLink'
import { getSiteUrl } from '@/shared/lib/env'
import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'

const META_DESCRIPTION_MAX = 160

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<RawCatalogSearchParams>
}

const productsLabel = (n: number) => `${n} ${n === 1 ? 'producto' : 'productos'}`

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const data = await getBrandBySlug(slug)
  if (!data) return { title: 'Marca no encontrada', robots: { index: false } }

  const { brand } = data
  const text =
    brand.description?.trim() ||
    brand.tagline?.trim() ||
    `${brand.name}: ${productsLabel(brand.productCount)} originales en MIRANA, tienda de coleccionables en Perú.`
  const description =
    text.length > META_DESCRIPTION_MAX ? `${text.slice(0, META_DESCRIPTION_MAX - 1).trimEnd()}…` : text
  const url = `/marcas/${brand.slug}`
  const image = brand.heroUrl || brand.imageUrl

  return {
    title: brand.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title: brand.name,
      description,
      url,
      images: image ? [{ url: image, alt: brand.name }] : undefined,
    },
    twitter: { card: brand.heroUrl ? 'summary_large_image' : 'summary', title: brand.name, description },
  }
}

export default async function BrandPage({ params, searchParams }: PageProps) {
  const [{ slug }, raw] = await Promise.all([params, searchParams])
  const data = await getBrandBySlug(slug)
  if (!data) notFound()

  const { brand, categories } = data
  const catalogParams = parseCatalogParams(raw)
  const path = `/marcas/${brand.slug}`
  const activeCat = catalogParams.cats.length === 1 ? catalogParams.cats[0] : null

  const siteUrl = getSiteUrl()
  const crumbs = [
    { label: 'Inicio', path: '/' },
    { label: 'Marcas', path: '/marcas' },
    { label: brand.name, path },
  ]

  const brandJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Brand',
    name: brand.name,
    url: `${siteUrl}${path}`,
    logo: brand.imageUrl || undefined,
    image: brand.heroUrl || brand.imageUrl || undefined,
    slogan: brand.tagline || undefined,
    description: brand.description || undefined,
  }

  return (
    <>
      <JsonLd data={brandJsonLd} />
      <JsonLd data={breadcrumbJsonLd(siteUrl, crumbs)} />

      <section className="shell pb-20 pt-8 sm:pt-10">
        <Breadcrumbs
          items={[{ label: 'Inicio', href: '/' }, { label: 'Marcas', href: '/marcas' }, { label: brand.name }]}
        />

        <PageHero
          title={brand.name}
          description={brand.description || brand.tagline}
          imageUrl={brand.heroUrl}
          meta={
            brand.description && brand.tagline
              ? `${brand.tagline} · ${productsLabel(brand.productCount)}`
              : productsLabel(brand.productCount)
          }
          badge={
            brand.imageUrl ? (
              <div className="relative w-36 sm:w-44 aspect-[22/9] mb-4 overflow-hidden border border-(--bd) bg-card">
                <Image
                  src={brand.imageUrl}
                  alt={`Logo de ${brand.name}`}
                  fill
                  sizes="176px"
                  className="object-cover"
                  priority
                />
              </div>
            ) : null
          }
        />

        {categories.length > 1 && (
          <ChipRow label={`Categorías de ${brand.name}`} className="mb-8">
            <li className="snap-start">
              <ChipLink href={path} active={catalogParams.cats.length === 0} count={brand.productCount}>
                Todo {brand.name}
              </ChipLink>
            </li>
            {categories.map((c) => (
              <li key={c.id} className="snap-start">
                <ChipLink
                  href={buildCatalogUrl({ cat: [c.slug] }, path)}
                  active={activeCat === c.slug}
                  count={c.productCount}
                >
                  {c.name}
                </ChipLink>
              </li>
            ))}
          </ChipRow>
        )}

        <h2 className="sr-only">Productos de {brand.name}</h2>
        <CatalogBrowser
          params={catalogParams}
          basePath={path}
          scope={{ brandSlug: brand.slug }}
          emptyScopeText={`Todavía no hay productos de ${brand.name}. Vuelve pronto o explora el catálogo.`}
        />
      </section>
    </>
  )
}
