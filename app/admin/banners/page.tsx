import { BannerCard } from "@/features/banners/components/BannerCard";
import { BannerCrudProvider } from "@/features/banners/components/BannerCrudProvider";
import { NewBannerButton } from "@/features/banners/components/NewBannerButton";
import { getBannerStatus } from "@/features/banners/lib/banner-status";
import { getBanners } from "@/features/banners/queries/banner.queries";
import { PanelHeader } from "@/shared/components/admin/PanelHeader";

export default async function BannersPage() {
  const banners = await getBanners();
  const activeCount = banners.filter((b) => getBannerStatus(b) === "activo").length;

  return (
    <BannerCrudProvider>
      <div className="px-8 pt-7 pb-12">
        <PanelHeader
          label="Marketing"
          title={`${activeCount} banner${activeCount !== 1 ? "s" : ""} activo${activeCount !== 1 ? "s" : ""}`}
          align="center"
          side={<NewBannerButton />}
        />

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {banners.map((banner) => (
            <BannerCard key={banner.id} banner={banner} />
          ))}
        </div>
      </div>
    </BannerCrudProvider>
  );
}
