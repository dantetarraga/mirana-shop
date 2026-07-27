import 'server-only'
import { hasBannerImage } from '@/features/banners/lib/banner-image'
import { db } from '@/shared/lib/db'
import type { BannerRow } from '@/features/banners/types'

export const BANNER_SELECT = {
  id: true,
  title: true,
  subtitle: true,
  imageUrl: true,
  imageUrlMobile: true,
  imageUrlFull: true,
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
  const banners = await db.banner.findMany({
    where: {
      active: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    select: BANNER_SELECT,
    orderBy: { position: 'asc' },
  })

  // Un banner sin ninguna imagen no se puede pintar: se omite aunque esté
  // activo. El filtro va en JS y no en el `where` porque hay que tratar la
  // cadena vacía igual que el NULL en las tres columnas, y son pocas filas.
  return banners.filter(hasBannerImage)
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
