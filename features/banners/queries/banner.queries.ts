import 'server-only'
import { db } from '@/shared/lib/db'
import type { BannerRow } from '@/features/banners/types'

export const BANNER_SELECT = {
  id: true,
  title: true,
  subtitle: true,
  imageUrl: true,
  ctaLabel: true,
  ctaHref: true,
  position: true,
  active: true,
  startsAt: true,
  endsAt: true,
  createdAt: true,
  updatedAt: true,
} as const

export async function getActiveBanners(): Promise<BannerRow[]> {
  const now = new Date()
  return db.banner.findMany({
    where: {
      active: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    select: BANNER_SELECT,
    orderBy: { position: 'asc' },
  })
}

export async function getBanners(): Promise<BannerRow[]> {
  return db.banner.findMany({
    select: BANNER_SELECT,
    orderBy: [{ active: 'desc' }, { position: 'asc' }],
  })
}

export async function getBannerById(id: string): Promise<BannerRow | null> {
  return db.banner.findUnique({ where: { id }, select: BANNER_SELECT })
}
