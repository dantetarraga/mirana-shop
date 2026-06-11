import type { BannerRow } from '@/modules/catalog/repositories/banner.repo'
import { BannerCard } from './BannerCard'

interface BannersGridProps {
  banners: BannerRow[]
  onEdit: (bannerId: string) => void
  onToggle: (banner: BannerRow) => void
  onDelete: (banner: BannerRow) => void
  isPending: boolean
}

/**
 * Server Component que renderiza la grid de banners.
 * Los BannerCard son Client Components que manejan la interacción.
 */
export function BannersGrid({ banners, onEdit, onToggle, onDelete, isPending }: BannersGridProps) {
  return (
    <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
      {banners.map((banner) => (
        <BannerCard
          key={banner.id}
          banner={banner}
          onEdit={() => onEdit(banner.id)}
          onToggle={() => onToggle(banner)}
          onDelete={() => onDelete(banner)}
          isPending={isPending}
        />
      ))}
    </div>
  )
}
