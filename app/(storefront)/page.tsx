import { getActiveBanners } from '@/features/banners/queries/banner.queries'
import { getPublicBrands } from '@/features/brands/queries/brand.queries'
import { BrandsCarousel } from '@/features/home/components/BrandsCarousel'
import { CTABand } from '@/features/home/components/CTABand'
import { CategoryTiles, CategoryTilesSkeleton } from '@/features/home/components/CategoryTiles'
import { FeaturedProducts } from '@/features/home/components/FeaturedProducts'
import { HeroBannerCarousel } from '@/features/home/components/HeroBannerCarousel'
import { HeroBannerFade } from '@/features/home/components/HeroBannerFade'
import { CTABandSkeleton, HomeSectionSkeleton } from '@/features/home/components/HomeSectionSkeleton'
import { HomeSections } from '@/features/home/components/HomeSections'
import { NewArrivals } from '@/features/home/components/NewArrivals'
import { PreorderSection } from '@/features/home/components/PreorderSection'
import { PromoBanner } from '@/features/home/components/PromoBanner'
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
  // Banners y marcas en el primer render. Todo sale de la caché de datos; el
  // layout pide las mismas destacadas y `cache()` las resuelve una sola vez.
  const [activeBanners, featuredBrands, bannerLayout] = await Promise.all([
    getActiveBanners(),
    getPublicBrands({ featuredOnly: true }),
    getBannerLayout(),
  ])
  // Carrusel: destacadas por `position`. Si el admin aún no marcó ninguna, se
  // muestran todas las visibles para no dejar la cabecera sin marcas.
  const carouselBrands = (
    featuredBrands.length > 0 ? featuredBrands : await getPublicBrands()
  ).filter((b) => b.productCount > 0)
  const { organizationJsonLd, websiteJsonLd } = buildJsonLd(getSiteUrl())

  const isFullscreen = bannerLayout === 'FULLSCREEN'

  return (
    <>
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={websiteJsonLd} />

      {/* Los banners pueden no traer texto: el h1 garantiza un encabezado
          principal para lectores de pantalla y buscadores. */}
      <h1 className="sr-only">MIRANA — Juguetes, figuras de colección y modelos a escala</h1>

      {/* El hero abre la página pegado a la navbar: accesos rápidos y
          categorías ya están en el navbar y el mega-menú, y repetirlos aquí
          apilaba cuatro franjas antes del primer banner. El ajuste global
          `bannerLayout` de /admin/settings decide la forma del hero. */}
      {isFullscreen ? (
        <HeroBannerFade banners={activeBanners} />
      ) : (
        <HeroBannerCarousel banners={activeBanners} />
      )}

      <PromoBanner />
      <BrandsCarousel brands={carouselBrands} />
      <Suspense fallback={<CategoryTilesSkeleton />}>
        <CategoryTiles />
      </Suspense>
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
      <Suspense fallback={<HomeSectionSkeleton cards={3} grid="auto" />}>
        <PreorderSection />
      </Suspense>
    </>
  )
}
