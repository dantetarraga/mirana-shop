import { bannerRepo } from "@/modules/catalog/repositories/banner.repo";
import { BannersClient } from "@/features/admin/banners/components/BannersClient";

export default async function BannersPage() {
  const banners = await bannerRepo.findAll();

  return <BannersClient banners={banners} />;
}
