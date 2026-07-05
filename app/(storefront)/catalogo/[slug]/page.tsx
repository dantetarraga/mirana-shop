import { AddToCartPanel } from '@/features/products/components/AddToCartPanel'
import { RelatedProducts } from '@/features/products/components/RelatedProducts'
import { getProductBySlug } from '@/features/products/queries/product.queries'
import type { CatalogProduct } from '@/features/products/types/catalog.types'
import { getCategoryLabel, getCategoryStripe } from '@/features/products/types/catalog.types'
import { JsonLd } from '@/shared/components/JsonLd'
import { Dates } from '@/shared/lib/dates'
import { ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: 'Producto no encontrado' }

  const description = product.description || `${product.name} — ${product.brand.name}`
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
  const raw = await getProductBySlug(slug)

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
    stock: raw.inventory?.availableStock ?? 0,
  }

  const stripe = getCategoryStripe(product.category.slug)
  const catLabel = getCategoryLabel(product.category.slug)
  const isOutOfStock = product.stock === 0 || product.status === 'SOLD_OUT'
  const displayPrice = product.salePrice && product.salePrice < product.price
    ? product.salePrice
    : product.price

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: raw.description || undefined,
    sku: product.sku,
    image: product.imageUrl ? [product.imageUrl] : undefined,
    brand: { '@type': 'Brand', name: product.brand.name },
    offers: {
      '@type': 'Offer',
      url: `${BASE_URL}/catalogo/${product.slug}`,
      priceCurrency: raw.currency ?? 'PEN',
      price: displayPrice.toFixed(2),
      availability:
        product.status === 'PREORDER'
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
          <div
            className={`${stripe} glow-section glow-section--card aspect-square flex items-center justify-center relative`}
          >
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="relative z-1 object-cover"
              />
            ) : (
              <div className="relative z-1 font-mono text-[12px] tracking-[2px] text-muted uppercase">
                {product.name.toUpperCase()}
              </div>
            )}

            {/* Badges */}
            {product.featured && !isOutOfStock && (
              <div className="z-1 absolute top-4 left-0 text-[9px] font-extrabold tracking-[2px] uppercase px-3 py-1.5 bg-(--gold) text-black">
                DESTACADO
              </div>
            )}
            {isOutOfStock && (
              <div className="z-1 absolute top-4 left-0 text-[9px] font-extrabold tracking-[2px] uppercase px-3 py-1.5 bg-[#ff6644]/80 text-white">
                AGOTADO
              </div>
            )}
            {product.status === 'PREORDER' && (
              <div className="z-1 absolute top-4 left-0 text-[9px] font-extrabold tracking-[2px] uppercase px-3 py-1.5 bg-[#8b7cff] text-white">
                PREVENTA
              </div>
            )}
          </div>

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
              <div className="font-display text-[40px] sm:text-[56px] font-black text-(--gold) leading-none">
                S/ {displayPrice.toFixed(2)}
              </div>
              {product.salePrice && product.salePrice < product.price && (
                <div className="font-display text-[22px] sm:text-[28px] font-bold text-muted line-through">
                  S/ {product.price.toFixed(2)}
                </div>
              )}
            </div>

            {/* Stock indicator */}
            {!isOutOfStock && product.stock <= 8 && (
              <div className="text-[12px] text-[#ffb84a] font-semibold tracking-[0.5px]">
                ⚠ Solo quedan {product.stock} unidades
              </div>
            )}

            {/* Description */}
            {raw.description && (
              <p className="text-[14px] text-muted leading-relaxed max-w-120">{raw.description}</p>
            )}

            {/* Add to cart */}
            <AddToCartPanel product={product} />
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
