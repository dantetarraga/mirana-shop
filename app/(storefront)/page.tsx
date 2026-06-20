import type { Metadata } from "next";
import { getActiveBanners } from "@/features/banners/queries/banner.queries";
import { getBrands }  from "@/features/brands/queries/brand.queries";
import { getCategories } from "@/features/categories/queries/category.queries";
import { HeroSection }      from "@/features/home/components/HeroSection";
import { PromoBanner }      from "@/features/home/components/PromoBanner";
import { NewArrivals }      from "@/features/home/components/NewArrivals";
import { FeaturedProducts } from "@/features/home/components/FeaturedProducts";
import { CTABand }          from "@/features/home/components/CTABand";
import { CategoryStrips }   from "@/features/home/components/CategoryStrips";
import { BrandsCarousel }   from "@/features/home/components/BrandsCarousel";
import { ReviewsSection }   from "@/features/home/components/ReviewsSection";
import { PreorderSection }  from "@/features/home/components/PreorderSection";

export const metadata: Metadata = {
  title:       "MIRANA — Juguetes & Figuras",
  description: "Figuras de colección, preventas exclusivas e importaciones directas. Tu tienda premium de coleccionables.",
};

export default async function HomePage() {
  const [activeBanners, categories, brands] = await Promise.all([
    getActiveBanners(),
    getCategories({ perPage: 50 }),
    getBrands({ perPage: 50 }),
  ]);

  const heroBanner = activeBanners.sort((a, b) => a.position - b.position)[0] ?? null;

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
  );
}
