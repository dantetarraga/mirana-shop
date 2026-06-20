import { AddToCartPanel } from '@/features/products/components/AddToCartPanel'
import { RelatedProducts } from '@/features/products/components/RelatedProducts'
import { productRepo } from '@/features/products/services/product.service'
import type { CatalogProduct } from '@/features/products/types/catalog.types'
import { getCategoryLabel, getCategoryStripe } from '@/features/products/types/catalog.types'
import { ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await productRepo.findBySlug(slug)
  if (!product) return { title: 'Producto no encontrado' }
  return {
    title: product.name,
    description: product.description || `${product.name} — ${product.brand.name}`,
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params
  const raw = await productRepo.findBySlug(slug)

  if (!raw) notFound()

  // Serialize Decimal fields
  const product: CatalogProduct = {
    id: raw.id,
    sku: raw.sku,
    slug: raw.slug,
    name: raw.name,
    price: Number(raw.price),
    compareAtPrice: raw.compareAtPrice != null ? Number(raw.compareAtPrice) : null,
    status: raw.status,
    featured: raw.featured,
    category: raw.category,
    brand: raw.brand,
    imageUrl: raw.images[0]?.url ?? null,
    stock: raw.inventory?.availableStock ?? 0,
  }

  const stripe = getCategoryStripe(product.category.slug)
  const catLabel = getCategoryLabel(product.category.slug)
  const isOutOfStock = product.stock === 0 || product.status === 'SOLD_OUT'

  return (
    <>
      <div className="px-6 py-12 max-w-360 mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[11px] tracking-[1.5px] uppercase text-muted mb-10">
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
          <span className="text-text">{product.name}</span>
        </nav>

        {/* Main grid */}
        <div className="grid grid-cols-2 gap-16 items-start">
          {/* Left — image */}
          <div className={`${stripe} aspect-square flex items-center justify-center relative`}>
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover absolute inset-0"
              />
            ) : (
              <div className="font-mono text-[12px] tracking-[2px] text-muted uppercase">
                {product.name.toUpperCase()}
              </div>
            )}

            {/* Badges */}
            {product.featured && !isOutOfStock && (
              <div className="absolute top-4 left-0 text-[9px] font-extrabold tracking-[2px] uppercase px-3 py-1.5 bg-(--gold) text-black">
                DESTACADO
              </div>
            )}
            {isOutOfStock && (
              <div className="absolute top-4 left-0 text-[9px] font-extrabold tracking-[2px] uppercase px-3 py-1.5 bg-[#ff6644]/80 text-white">
                AGOTADO
              </div>
            )}
            {product.status === 'PREORDER' && (
              <div className="absolute top-4 left-0 text-[9px] font-extrabold tracking-[2px] uppercase px-3 py-1.5 bg-[#5f9eff] text-white">
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
            <div className="flex items-baseline gap-4">
              <div className="font-display text-[56px] font-black text-(--gold) leading-none">
                S/ {product.price.toFixed(2)}
              </div>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <div className="font-display text-[28px] font-bold text-muted line-through">
                  S/ {product.compareAtPrice.toFixed(2)}
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
