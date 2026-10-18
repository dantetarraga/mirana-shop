import { effectivePrice } from '@/features/checkout/lib/pricing'
import { AddToCartPanel } from '@/features/products/components/AddToCartPanel'
import { ProductImageCarousel } from '@/features/products/components/ProductImageCarousel'
import { ProductPrice } from '@/features/products/components/ProductPrice'
import { RelatedProducts } from '@/features/products/components/RelatedProducts'
import { RelatedProductsSkeleton } from '@/features/products/components/RelatedProductsSkeleton'
import { getProductBadge } from '@/features/products/lib/product-badge'
import { getProductBySlug } from '@/features/products/queries/product.queries'
import { getPreorderDepositPercent } from '@/features/settings/queries/store-settings.queries'
import type { CatalogProduct } from '@/features/products/types/catalog.types'
import { getCategoryStripe } from '@/features/products/types/catalog.types'
import { getCategoryPageData } from '@/features/categories/queries/category.queries'
import { JsonLd } from '@/shared/components/JsonLd'
import { Breadcrumbs, breadcrumbJsonLd } from '@/shared/components/layout/Breadcrumbs'
import { Dates } from '@/shared/lib/dates'
import { stripHtml, toRichHtml } from '@/shared/lib/rich-text'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSiteUrl } from '@/shared/lib/env'
import { Suspense } from 'react'

/** Máximo de caracteres del meta description (Google corta ~160). */
const META_DESCRIPTION_MAX = 300

/** Descripción en texto plano y recortada — para metadatos y JSON-LD. */
function toPlainDescription(description: string): string {
  const text = stripHtml(toRichHtml(description))
  return text.length > META_DESCRIPTION_MAX
    ? `${text.slice(0, META_DESCRIPTION_MAX).trimEnd()}…`
    : text
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: 'Producto no encontrado' }

  const description =
    toPlainDescription(product.description) || `${product.name} — ${product.brand.name}`
  const imageUrl = product.images[0]?.url
  const url = `/catalogo/${product.slug}`

  return {
    title: product.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: product.name,
      description,
      url,
      images: imageUrl ? [{ url: imageUrl, alt: product.name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params
  const [raw, defaultDepositPercent] = await Promise.all([
    getProductBySlug(slug),
    getPreorderDepositPercent(),
  ])

  if (!raw) notFound()

  // Serialize Decimal fields
  const product: CatalogProduct = {
    id: raw.id,
    sku: raw.sku,
    slug: raw.slug,
    name: raw.name,
    price: Number(raw.price),
    salePrice: raw.salePrice != null ? Number(raw.salePrice) : null,
    status: raw.status,
    featured: raw.featured,
    createdAt: raw.createdAt,
    isNewArrival: raw.status === 'AVAILABLE' && Dates.isWithinLastDays(raw.createdAt, 30),
    category: raw.category,
    brand: raw.brand,
    imageUrl: raw.images[0]?.url ?? null,
    images: raw.images.map((img) => ({ url: img.url, alt: img.alt })),
    stock: raw.inventory?.availableStock ?? 0,
    allowPartialPreorder: raw.allowPartialPreorder,
    preorderDepositPercent: raw.preorderDepositPercent,
    estimatedArrival: raw.estimatedArrival,
  }

  const descriptionHtml = toRichHtml(raw.description)
  const stripe = getCategoryStripe(product.category.slug)
  const catLabel = product.category.name
  // Migas reales (Padre › Hija) desde la lista pública cacheada de categorías:
  // si la categoría está oculta no hay página a la que enlazar y se cae al
  // catálogo general.
  const categoryData = await getCategoryPageData(product.category.slug)
  const categoryCrumbs = categoryData
    ? [...categoryData.ancestors, categoryData.category].map((c) => ({
        label: c.name,
        path: `/categorias/${c.slug}`,
      }))
    : [{ label: 'Catálogo', path: '/catalogo' }]
  const crumbs = [
    { label: 'Inicio', path: '/' },
    ...categoryCrumbs,
    { label: product.name, path: `/catalogo/${product.slug}` },
  ]
  // Misma regla que la card: la preventa se reserva sin stock, así
  // que no cuenta como agotada (antes esta página la marcaba AGOTADO y PREVENTA
  // a la vez, y su panel de compra la daba por no comprable).
  const isPreorder = product.status === 'PREORDER'
  const isOutOfStock = product.status === 'SOLD_OUT' || (!isPreorder && product.stock === 0)
  const displayPrice = effectivePrice(product)

  // Misma badge que la card (features/products/lib/product-badge.ts).
  const badge = getProductBadge({ ...product, isOutOfStock })

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: toPlainDescription(raw.description) || undefined,
    sku: product.sku,
    image: product.imageUrl ? [product.imageUrl] : undefined,
    brand: { '@type': 'Brand', name: product.brand.name },
    offers: {
      '@type': 'Offer',
      url: `${getSiteUrl()}/catalogo/${product.slug}`,
      priceCurrency: raw.currency ?? 'PEN',
      price: displayPrice.toFixed(2),
      availability: isPreorder
        ? 'https://schema.org/PreOrder'
        : isOutOfStock
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
    },
  }

  return (
    <>
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd(getSiteUrl(), crumbs)} />

      <div className="px-4 sm:px-6 py-8 sm:py-12 max-w-360 mx-auto">
        <Breadcrumbs
          className="sm:mb-10"
          items={crumbs.map((c, i) => ({
            label: c.label,
            href: i < crumbs.length - 1 ? c.path : undefined,
          }))}
        />

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
          {/* Left — image */}
          <ProductImageCarousel
            images={product.images}
            name={product.name}
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className={`${stripe} glow-section glow-section--card aspect-square flex items-center justify-center relative`}
          >
            {/* Una sola badge por prioridad, como en ProductCard: las tres se
                posicionaban en el mismo top/left y se pisaban entre sí. */}
            {badge && (
              <div
                className={`z-2 absolute top-4 left-0 text-[11px] font-extrabold tracking-[1.5px] uppercase px-3 py-1.5 ${badge.className}`}
              >
                {badge.label}
              </div>
            )}
          </ProductImageCarousel>

          {/* Right — info */}
          <div className="flex flex-col gap-6 pt-2">
            {/* Categoría · Marca — enlazan a sus páginas */}
            <div className="text-[11px] tracking-[3px] uppercase text-muted">
              {categoryData ? (
                <Link href={`/categorias/${product.category.slug}`} className="hover:text-text transition-colors">
                  {catLabel}
                </Link>
              ) : (
                catLabel
              )}{' '}
              ·{' '}
              <Link href={`/marcas/${product.brand.slug}`} className="hover:text-text transition-colors">
                {product.brand.name}
              </Link>
            </div>

            {/* Name */}
            <h1 className="font-display font-black uppercase leading-[0.95] tracking-[-1px] text-[clamp(36px,5vw,64px)]">
              {product.name}
            </h1>

            {/* SKU */}
            <div className="font-mono text-[11px] text-muted tracking-[1px]">
              SKU: {product.sku}
            </div>

            {/* Price — %, tachado y "Ahorras S/ X" */}
            <ProductPrice price={product.price} salePrice={product.salePrice} />

            {/* El aviso de "últimas unidades" vive ahora en AddToCartPanel: aquí
                se calculaba sobre el stock crudo y seguía apareciendo aunque el
                cliente ya tuviera todas esas unidades en su carrito. */}

            {product.estimatedArrival && (
              <div className="text-[13px] text-muted">
                Entrega estimada:{' '}
                <span className="text-text font-semibold">
                  {Dates.format(product.estimatedArrival)}
                </span>
              </div>
            )}

            {/* Description — HTML del editor del admin (saneado al guardar).
                Las descripciones antiguas en texto plano/Markdown se convierten
                al vuelo, escapando el contenido antes de renderizarlo. */}
            {descriptionHtml && (
              <div
                className="rich-prose rich-prose--compact max-w-120"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            )}

            {/* Add to cart */}
            <AddToCartPanel product={product} defaultDepositPercent={defaultDepositPercent} />
          </div>
        </div>
      </div>

      {/* Streaming: los relacionados (3 queries) ya no retrasan el HTML de la
          ficha; llegan después con su propio esqueleto. */}
      <Suspense fallback={<RelatedProductsSkeleton />}>
        <RelatedProducts
          currentId={raw.id}
          categorySlug={raw.category.slug}
          brandSlug={raw.brand.slug}
          collectionSlugs={raw.collections.map((c) => c.collection.slug)}
        />
      </Suspense>
    </>
  )
}
