import { getActiveBanners } from '@/features/banners/queries/banner.queries'
import { getBrands } from '@/features/brands/queries/brand.queries'
import { getCategories } from '@/features/categories/queries/category.queries'
import { BrandsCarousel } from '@/features/home/components/BrandsCarousel'
import { CTABand } from '@/features/home/components/CTABand'
import { CategoryStrips } from '@/features/home/components/CategoryStrips'
import { FeaturedProducts } from '@/features/home/components/FeaturedProducts'
import { HeroSection } from '@/features/home/components/HeroSection'
import { NewArrivals } from '@/features/home/components/NewArrivals'
import { PreorderSection } from '@/features/home/components/PreorderSection'
import { PromoBanner } from '@/features/home/components/PromoBanner'
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

  const heroBanner = activeBanners[0] ?? null

  return (
    <>
      <HeroSection banner={heroBanner} />
      <PromoBanner />
      <NewArrivals />
      <FeaturedProducts />
      <CTABand />
      <CategoryStrips categories={categories} />
      <PreorderSection />
      <BrandsCarousel brands={brands} />
      <ReviewsSection />
    </>
  )
}
