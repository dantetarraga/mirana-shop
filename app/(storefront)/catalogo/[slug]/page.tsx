import { effectivePrice } from '@/features/checkout/lib/pricing'
import { AddToCartPanel } from '@/features/products/components/AddToCartPanel'
import { ProductImageCarousel } from '@/features/products/components/ProductImageCarousel'
import { RelatedProducts } from '@/features/products/components/RelatedProducts'
import { getProductBySlug } from '@/features/products/queries/product.queries'
import { getPreorderDepositPercent } from '@/features/settings/queries/store-settings.queries'
import type { CatalogProduct } from '@/features/products/types/catalog.types'
import { getCategoryLabel, getCategoryStripe } from '@/features/products/types/catalog.types'
import { JsonLd } from '@/shared/components/JsonLd'
import { Dates } from '@/shared/lib/dates'
import { stripHtml, toRichHtml } from '@/shared/lib/rich-text'
import { ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

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
  const catLabel = getCategoryLabel(product.category.slug)
  // Misma regla que la card y el modal: la preventa se reserva sin stock, así
  // que no cuenta como agotada (antes esta página la marcaba AGOTADO y PREVENTA
  // a la vez, y su panel de compra la daba por no comprable).
  const isPreorder = product.status === 'PREORDER'
  const isOutOfStock = product.status === 'SOLD_OUT' || (!isPreorder && product.stock === 0)
  const displayPrice = effectivePrice(product)

  const badge = isOutOfStock
    ? { label: 'AGOTADO', className: 'bg-danger text-white' }
    : isPreorder
      ? { label: 'PREVENTA', className: 'bg-info text-white' }
      : product.featured
        ? { label: 'DESTACADO', className: 'bg-(--gold) text-black' }
        : null

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
      url: `${BASE_URL}/catalogo/${product.slug}`,
      priceCurrency: raw.currency ?? 'PEN',
      price: displayPrice.toFixed(2),
      availability: isPreorder
        ? 'https://schema.org/PreOrder'
          : isOutOfStock
            ? 'https://schema.org/OutOfStock'
            : 'https://schema.org/InStock',
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
        name: catLabel,
        item: `${BASE_URL}/catalogo?cat=${product.category.slug}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: product.name,
        item: `${BASE_URL}/catalogo/${product.slug}`,
      },
    ],
  }

  return (
    <>
      <JsonLd data={productJsonLd} />
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
          <Link
            href={`/catalogo?cat=${product.category.slug}`}
            className="hover:text-text transition-colors"
          >
            {catLabel}
          </Link>
          <ChevronRight size={12} />
          <span className="text-text truncate max-w-[160px] sm:max-w-none">{product.name}</span>
        </nav>

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
                className={`z-1 absolute top-4 left-0 text-[9px] font-extrabold tracking-[2px] uppercase px-3 py-1.5 ${badge.className}`}
              >
                {badge.label}
              </div>
            )}
          </ProductImageCarousel>

          {/* Right — info */}
          <div className="flex flex-col gap-6 pt-2">
            {/* Category · Brand */}
            <div className="text-[11px] tracking-[3px] uppercase text-muted">
              {catLabel} · {product.brand.name}
            </div>

            {/* Name */}
            <h1 className="font-display font-black uppercase leading-[0.95] tracking-[-1px] text-[clamp(36px,5vw,64px)]">
              {product.name}
            </h1>

            {/* SKU */}
            <div className="font-mono text-[11px] text-muted tracking-[1px]">
              SKU: {product.sku}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-4 flex-wrap">
              <div className="font-display text-[40px] sm:text-[56px] font-black text-accent-ink leading-none">
                S/ {displayPrice.toFixed(2)}
              </div>
              {product.salePrice && product.salePrice < product.price && (
                <div className="font-display text-[22px] sm:text-[28px] font-bold text-muted line-through">
                  S/ {product.price.toFixed(2)}
                </div>
              )}
            </div>

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

      <RelatedProducts
        currentId={raw.id}
        categorySlug={raw.category.slug}
        brandSlug={raw.brand.slug}
        collectionSlugs={raw.collections.map((c) => c.collection.slug)}
      />
    </>
  )
}
