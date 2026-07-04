import { getActiveBanners } from '@/features/banners/queries/banner.queries'
import { getBrands } from '@/features/brands/queries/brand.queries'
import { getCategories } from '@/features/categories/queries/category.queries'
import { BrandsCarousel } from '@/features/home/components/BrandsCarousel'
import { CTABand } from '@/features/home/components/CTABand'
import { CategoryStrips } from '@/features/home/components/CategoryStrips'
import { FeaturedProducts } from '@/features/home/components/FeaturedProducts'
import { HeroBannerCarousel } from '@/features/home/components/HeroBannerCarousel'
import { NewArrivals } from '@/features/home/components/NewArrivals'
import { PreorderSection } from '@/features/home/components/PreorderSection'
import { PromoBanner } from '@/features/home/components/PromoBanner'
import { QuickFiltersBar } from '@/features/home/components/QuickFiltersBar'
import { ReviewsSection } from '@/features/home/components/ReviewsSection'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MIRANA — Juguetes & Figuras',
  description:
    'Figuras de colección, preventas exclusivas e importaciones directas. Tu tienda premium de coleccionables.',
}

export default async function HomePage() {
  const [activeBanners, categories, brands] = await Promise.all([
    getActiveBanners(),
    getCategories({ perPage: 50 }),
    getBrands({ perPage: 50 }),
  ])

  return (
    <>
      {/* Header extendido: filtros rápidos + marcas + banners (estructura tipo Entertainment Earth) */}
      <div className="pt-(--nh)">
        <QuickFiltersBar categories={categories} />
        <BrandsCarousel brands={brands} />
        <HeroBannerCarousel banners={activeBanners} />
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
