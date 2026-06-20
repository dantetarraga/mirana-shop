import { bannerRepo } from "@/features/banners/services/banner.service";
import { BannersClient } from "@/features/banners/components/BannersClient";

export default async function BannersPage() {
  const banners = await bannerRepo.findAll();

  return <BannersClient banners={banners} />;
}
