import type { Metadata } from "next";
import { bannerRepo } from "@/modules/catalog/repositories/banner.repo";
import { HeroSection } from "@/features/home/components/HeroSection";
import { PromoBanner } from "@/features/home/components/PromoBanner";
import { NewArrivals } from "@/features/home/components/NewArrivals";
import { FeaturedProducts } from "@/features/home/components/FeaturedProducts";
import { CTABand } from "@/features/home/components/CTABand";
import { CategoryStrips } from "@/features/home/components/CategoryStrips";
import { BrandsCarousel } from "@/features/home/components/BrandsCarousel";
import { ReviewsSection } from "@/features/home/components/ReviewsSection";

export const metadata: Metadata = {
  title: "MIRANA — Juguetes & Figuras",
  description: "Figuras de colección, preventas exclusivas e importaciones directas. Tu tienda premium de coleccionables.",
};

export default async function HomePage() {
  const activeBanners = await bannerRepo.findActive();
  // El banner hero es el de menor posición (position: 0 o el primero activo)
  const heroBanner = activeBanners.sort((a, b) => a.position - b.position)[0] ?? null;

  return (
    <>
      <HeroSection banner={heroBanner} />
      <PromoBanner />
      <NewArrivals />
      <FeaturedProducts />
      <CTABand />
      <CategoryStrips />
      <BrandsCarousel />
      <ReviewsSection />
    </>
  );
}
