import { getActiveBanners } from '@/features/banners/queries/banner.queries'
import { getBrands } from '@/features/brands/queries/brand.queries'
import { getCategories } from '@/features/categories/queries/category.queries'
import { BrandsCarousel } from '@/features/home/components/BrandsCarousel'
import { CTABand } from '@/features/home/components/CTABand'
import { CategoryStrips } from '@/features/home/components/CategoryStrips'
import { FeaturedProducts } from '@/features/home/components/FeaturedProducts'
import { HeroBannerCarousel } from '@/features/home/components/HeroBannerCarousel'
import { HeroBannerFade } from '@/features/home/components/HeroBannerFade'
import { NewArrivals } from '@/features/home/components/NewArrivals'
import { PreorderSection } from '@/features/home/components/PreorderSection'
import { PromoBanner } from '@/features/home/components/PromoBanner'
import { QuickFiltersBar } from '@/features/home/components/QuickFiltersBar'
import { ReviewsSection } from '@/features/home/components/ReviewsSection'
import { JsonLd } from '@/shared/components/JsonLd'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'MIRANA',
  url: BASE_URL,
  logo: `${BASE_URL}/logo.svg`,
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'MIRANA',
  url: BASE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${BASE_URL}/catalogo?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
}

export default async function HomePage() {
  const [activeBanners, categories, brands] = await Promise.all([
    getActiveBanners(),
    getCategories({ perPage: 50 }),
    getBrands({ perPage: 50 }),
  ])

  const fullscreenBanners = activeBanners.filter((b) => b.variant === 'FULLSCREEN')
  const cardBanners = activeBanners.filter((b) => b.variant === 'CARD')

  return (
    <>
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={websiteJsonLd} />

      {/* Header extendido: hero + filtros rápidos + marcas + banners
          (estructura tipo Entertainment Earth). Los banners FULLSCREEN abren
          la página pegados a la navbar; los CARD siguen en el grid/carrusel.
          Ambos componentes devuelven null con lista vacía, así que las dos
          variantes conviven o se usa solo una. */}
      <div className="pt-(--nh)">
        <HeroBannerFade banners={fullscreenBanners} />
        <QuickFiltersBar categories={categories} />
        <BrandsCarousel brands={brands} />
        <HeroBannerCarousel banners={cardBanners} />
      </div>

      <PromoBanner />
      <NewArrivals />
      <FeaturedProducts />
      <CTABand />
      <CategoryStrips categories={categories} />
      <PreorderSection />
      <ReviewsSection />
    </>
  )
}
