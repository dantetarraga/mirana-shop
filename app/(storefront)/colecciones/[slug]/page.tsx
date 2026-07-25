import { CollectionAddAllButton } from '@/features/collections/components/CollectionAddAllButton'
import { getPublicCollectionBySlug } from '@/features/collections/queries/collection.queries'
import { ProductCard } from '@/features/products/components/ProductCard'
import { toProductCards } from '@/features/products/lib/product-card'
import { getHideOutOfStock } from '@/features/settings/queries/store-settings.queries'
import { JsonLd } from '@/shared/components/JsonLd'
import { stripHtml, toRichHtml } from '@/shared/lib/rich-text'
import { ChevronRight, Layers } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

const META_DESCRIPTION_MAX = 300

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const collection = await getPublicCollectionBySlug(slug, await getHideOutOfStock())
  if (!collection) return { title: 'Colección no encontrada' }

  const text = stripHtml(toRichHtml(collection.description ?? ''))
  const description =
    (text.length > META_DESCRIPTION_MAX
      ? `${text.slice(0, META_DESCRIPTION_MAX).trimEnd()}…`
      : text) || `${collection.name} — ${collection.productCount} productos en MIRANA.`
  const url = `/colecciones/${collection.slug}`

  return {
    title: collection.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: collection.name,
      description,
      url,
      images: collection.imageUrl
        ? [{ url: collection.imageUrl, alt: collection.name }]
        : undefined,
    },
  }
}

export default async function CollectionDetailPage({ params }: PageProps) {
  const { slug } = await params
  const collection = await getPublicCollectionBySlug(slug, await getHideOutOfStock())

  if (!collection) notFound()

  const items = toProductCards(collection.products)
  const descriptionHtml = toRichHtml(collection.description ?? '')

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: collection.name,
    description: stripHtml(descriptionHtml) || undefined,
    url: `${BASE_URL}/colecciones/${collection.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: p.name,
        url: `${BASE_URL}/catalogo/${p.slug}`,
      })),
    },
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Catálogo', item: `${BASE_URL}/catalogo` },
      {
        '@type': 'ListItem',
        position: 3,
        name: collection.name,
        item: `${BASE_URL}/colecciones/${collection.slug}`,
      },
    ],
  }

  return (
    <>
      <JsonLd data={collectionJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <div className="px-4 sm:px-6 py-8 sm:py-12 max-w-360 mx-auto">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1.5 text-[11px] tracking-[1.5px] uppercase text-muted mb-6 sm:mb-10">
          <Link href="/" className="hover:text-text transition-colors">
            Inicio
          </Link>
          <ChevronRight size={12} />
          <Link href="/catalogo" className="hover:text-text transition-colors">
            Catálogo
          </Link>
          <ChevronRight size={12} />
          <span className="text-text truncate max-w-[160px] sm:max-w-none">{collection.name}</span>
        </nav>

        {/* Cabecera */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_1fr] gap-8 lg:gap-12 items-start mb-12">
          <div className="stripe-lego glow-section glow-section--card aspect-square relative flex items-center justify-center overflow-hidden">
            {collection.imageUrl ? (
              <Image
                src={collection.imageUrl}
                alt={collection.name}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 420px"
              />
            ) : (
              <Layers size={48} className="text-muted" aria-hidden />
            )}
            <div className="z-1 absolute top-4 left-0 text-[9px] font-extrabold tracking-[2px] uppercase px-3 py-1.5 bg-(--gold) text-black">
              COLECCIÓN
            </div>
          </div>

          <div className="flex flex-col gap-6 pt-2">
            <div className="text-[11px] tracking-[3px] uppercase text-muted">
              {collection.productCount} producto{collection.productCount !== 1 ? 's' : ''} en esta
              colección
            </div>

            <h1 className="font-display font-black uppercase leading-[0.95] tracking-[-1px] text-[clamp(36px,5vw,64px)]">
              {collection.name}
            </h1>

            {collection.fromPrice !== null && (
              <div className="flex items-baseline gap-2.5">
                <span className="text-[12px] text-muted uppercase tracking-[1.5px]">Desde</span>
                <span className="font-display text-[40px] sm:text-[56px] font-black text-(--gold) leading-none">
                  S/ {collection.fromPrice.toFixed(2)}
                </span>
              </div>
            )}

            {descriptionHtml && (
              <div
                className="rich-prose rich-prose--compact max-w-140"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            )}

            <div className="flex flex-wrap gap-2.5">
              <CollectionAddAllButton products={items} collectionName={collection.name} />
            </div>
          </div>
        </div>

        {/* Productos de la colección */}
        <h2 className="font-display font-black uppercase tracking-[-0.5px] text-[clamp(22px,3vw,32px)] mb-5">
          Productos de la colección
        </h2>

        {items.length === 0 ? (
          <div className="text-center py-16 px-5 text-muted">
            <div className="font-display text-[24px] font-black uppercase mb-2">
              Sin productos disponibles
            </div>
            <div className="text-[14px]">Vuelve a revisar pronto.</div>
          </div>
        ) : (
          <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
