import { getBanners } from "@/features/banners/queries/banner.queries";
import { BannersClient } from "@/features/banners/components/BannersClient";

export default async function BannersPage() {
  const banners = await getBanners();

  return <BannersClient banners={banners} />;
}
