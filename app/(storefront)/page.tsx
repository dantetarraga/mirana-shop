import { getActiveBanners } from '@/features/banners/queries/banner.queries'
import { getPublicBrands } from '@/features/brands/queries/brand.queries'
import { getPublicCategories } from '@/features/categories/queries/category.queries'
import { getPublicCollectionRows } from '@/features/collections/queries/collection.queries'
import { BrandsCarousel } from '@/features/home/components/BrandsCarousel'
import { CTABand } from '@/features/home/components/CTABand'
import { CategoryStrips } from '@/features/home/components/CategoryStrips'
import { FeaturedProducts } from '@/features/home/components/FeaturedProducts'
import { HeroBannerCarousel } from '@/features/home/components/HeroBannerCarousel'
import { HeroBannerFade } from '@/features/home/components/HeroBannerFade'
import { CTABandSkeleton, HomeSectionSkeleton } from '@/features/home/components/HomeSectionSkeleton'
import { HomeSections } from '@/features/home/components/HomeSections'
import { NewArrivals } from '@/features/home/components/NewArrivals'
import { PreorderSection } from '@/features/home/components/PreorderSection'
import { PromoBanner } from '@/features/home/components/PromoBanner'
import { QuickFiltersBar } from '@/features/home/components/QuickFiltersBar'
import { getBannerLayout } from '@/features/settings/queries/store-settings.queries'
import { JsonLd } from '@/shared/components/JsonLd'
import { getSiteUrl } from '@/shared/lib/env'
import { Suspense } from 'react'

function buildJsonLd(siteUrl: string) {
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'MIRANA',
    url: siteUrl,
    logo: `${siteUrl}/logo.svg`,
  }

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'MIRANA',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/catalogo?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }

  return { organizationJsonLd, websiteJsonLd }
}

export default async function HomePage() {
  // Cabecera (banners + filtros rápidos) en el primer render: es lo que se ve
  // sin hacer scroll. Todo sale de la caché de datos; el layout pide las mismas
  // categorías/colecciones y `cache()` las resuelve una sola vez.
  const [activeBanners, categories, brands, bannerLayout, collections] = await Promise.all([
    getActiveBanners(),
    getPublicCategories(),
    getPublicBrands(),
    getBannerLayout(),
    getPublicCollectionRows(),
  ])
  const { organizationJsonLd, websiteJsonLd } = buildJsonLd(getSiteUrl())

  const isFullscreen = bannerLayout === 'FULLSCREEN'

  return (
    <>
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={websiteJsonLd} />

      {/* Los banners pueden no traer texto: el h1 garantiza un encabezado
          principal para lectores de pantalla y buscadores. */}
      <h1 className="sr-only">MIRANA — Juguetes, figuras de colección y modelos a escala</h1>

      {/* Header extendido: filtros rápidos + marcas + banners (estructura tipo
          Entertainment Earth). El ajuste global `bannerLayout` de /admin/settings
          decide la forma: a pantalla completa el hero abre la página pegado a la
          navbar; como tarjetas van en su grid/carrusel debajo de las marcas. */}
      <div>
        {isFullscreen && <HeroBannerFade banners={activeBanners} />}
        <QuickFiltersBar categories={categories} brands={brands} collections={collections} />
        <BrandsCarousel brands={brands} />
        {!isFullscreen && <HeroBannerCarousel banners={activeBanners} />}
      </div>

      <PromoBanner />
      {/* Cada sección asíncrona hace streaming por su cuenta: una consulta lenta
          ya no retiene el HTML del resto de la página. */}
      <Suspense fallback={<HomeSectionSkeleton />}>
        <NewArrivals />
      </Suspense>
      <Suspense fallback={<HomeSectionSkeleton />}>
        <FeaturedProducts />
      </Suspense>
      {/* Secciones armadas por el admin en /admin/sections — van después de las
          fijas y entre ellas se ordenan por su propia posición. */}
      <Suspense fallback={null}>
        <HomeSections />
      </Suspense>
      <Suspense fallback={<CTABandSkeleton />}>
        <CTABand />
      </Suspense>
      <CategoryStrips categories={categories} />
      <Suspense fallback={<HomeSectionSkeleton cards={3} grid="auto" />}>
        <PreorderSection />
      </Suspense>
    </>
  )
}
