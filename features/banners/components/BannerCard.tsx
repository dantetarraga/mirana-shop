import { BannerCardActions } from '@/features/banners/components/BannerCardActions'
import { getBannerStatus } from '@/features/banners/lib/banner-status'
import type { BannerRow } from '@/features/banners/types'
import { StatusBadge } from '@/features/orders/components/StatusBadge'
import { BANNER_STATUS } from '@/shared/lib/admin/admin-constants'
import { ArrowRight } from 'lucide-react'

interface BannerCardProps {
  banner: BannerRow
}

export function BannerCard({ banner }: BannerCardProps) {
  const uiStatus = getBannerStatus(banner)

  return (
    <div className="overflow-hidden bg-card border border-(--bd)">
      {/* Preview del banner */}
      <div className="h-37.5 relative">
        <div className="stripe-fig absolute inset-0" />
        <div
          style={{ '--banner-img': `url(${banner.imageUrl})` } as React.CSSProperties}
          className="absolute inset-0 flex flex-col justify-center pl-6 bg-[linear-gradient(to_right,rgba(0,0,0,.55),rgba(0,0,0,.15)),var(--banner-img)] bg-cover bg-center"
        >
          <div className="font-display text-[26px] font-black uppercase leading-[0.95]">
            {banner.title}
          </div>
          <div className="text-[12px] mt-1 text-white/80">{banner.subtitle}</div>
          {banner.ctaLabel && (
            <div className="font-display font-extrabold text-[12px] tracking-[1px] uppercase px-3 py-1.25 mt-2.5 w-fit bg-(--gold) text-black">
              {banner.ctaLabel} <ArrowRight className="inline-block ml-1" />
            </div>
          )}
        </div>
        <span className="absolute top-3 right-3 bg-black/60">
          <StatusBadge config={BANNER_STATUS[uiStatus]} variant="filled" />
        </span>
      </div>

      {/* Metadatos y acciones */}
      <div className="px-4.5 py-4">
        <div className="flex justify-between py-1.5 text-[13px]">
          <span className="text-[11px] tracking-[1px] uppercase text-muted">Posición</span>
          <span className="font-semibold">{banner.position}</span>
        </div>
        {banner.ctaHref && (
          <div className="flex justify-between py-1.5 text-[13px]">
            <span className="text-[11px] tracking-[1px] uppercase text-muted">Enlace</span>
            <span className="font-mono text-[11px] truncate max-w-40">{banner.ctaHref}</span>
          </div>
        )}
        <BannerCardActions banner={banner} />
      </div>
    </div>
  )
}
