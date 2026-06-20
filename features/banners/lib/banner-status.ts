import type { BannerRow } from '@/features/banners/types'

export function getBannerStatus(banner: BannerRow): 'activo' | 'programado' | 'inactivo' {
  const now = new Date()
  if (!banner.active) return 'inactivo'
  if (banner.startsAt && banner.startsAt > now) return 'programado'
  return 'activo'
}
