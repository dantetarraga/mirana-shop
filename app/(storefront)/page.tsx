import { getActiveBanners } from '@/features/banners/queries/banner.queries'
import { getBrands } from '@/features/brands/queries/brand.queries'
import { getCategories } from '@/features/categories/queries/category.queries'
import { getCollections } from '@/features/collections/queries/collection.queries'
import { BrandsCarousel } from '@/features/home/components/BrandsCarousel'
import { CTABand } from '@/features/home/components/CTABand'
import { CategoryStrips } from '@/features/home/components/CategoryStrips'
import { FeaturedProducts } from '@/features/home/components/FeaturedProducts'
import { HeroBannerCarousel } from '@/features/home/components/HeroBannerCarousel'
import { HeroBannerFade } from '@/features/home/components/HeroBannerFade'
import { HomeSections } from '@/features/home/components/HomeSections'
import { NewArrivals } from '@/features/home/components/NewArrivals'
import { PreorderSection } from '@/features/home/components/PreorderSection'
import { PromoBanner } from '@/features/home/components/PromoBanner'
import { QuickFiltersBar } from '@/features/home/components/QuickFiltersBar'
import { ReviewsSection } from '@/features/home/components/ReviewsSection'
import { getBannerLayout } from '@/features/settings/queries/store-settings.queries'
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
  const [activeBanners, categories, brands, bannerLayout, collections] = await Promise.all([
    getActiveBanners(),
    getCategories({ perPage: 50 }),
    getBrands({ perPage: 50 }),
    getBannerLayout(),
    getCollections({ active: true, perPage: 50 }),
  ])

  const isFullscreen = bannerLayout === 'FULLSCREEN'

  return (
    <>
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={websiteJsonLd} />

      {/* Header extendido: filtros rápidos + marcas + banners (estructura tipo
          Entertainment Earth). El ajuste global `bannerLayout` de /admin/settings
          decide la forma: a pantalla completa el hero abre la página pegado a la
          navbar; como tarjetas van en su grid/carrusel debajo de las marcas. */}
      <div className="pt-(--nh)">
        {isFullscreen && <HeroBannerFade banners={activeBanners} />}
        <QuickFiltersBar categories={categories} brands={brands} collections={collections} />
        <BrandsCarousel brands={brands} />
        {!isFullscreen && <HeroBannerCarousel banners={activeBanners} />}
      </div>

      <PromoBanner />
      <NewArrivals />
      <FeaturedProducts />
      {/* Secciones armadas por el admin en /admin/sections — van después de las
          fijas y entre ellas se ordenan por su propia posición. */}
      <HomeSections />
      <CTABand />
      <CategoryStrips categories={categories} />
      <PreorderSection />
      <ReviewsSection />
    </>
  )
}
