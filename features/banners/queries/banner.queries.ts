import 'server-only'
import { hasBannerImage } from '@/features/banners/lib/banner-image'
import {
  cachedQuery,
  CACHE_TAGS,
  REVALIDATE_SHORT,
  reviveDate,
} from '@/shared/lib/data-cache'
import { db } from '@/shared/lib/db'
import { cache } from 'react'
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

async function fetchActiveBanners(): Promise<BannerRow[]> {
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

function reviveBanner(b: BannerRow): BannerRow {
  return {
    ...b,
    startsAt: reviveDate(b.startsAt),
    endsAt: reviveDate(b.endsAt),
    createdAt: reviveDate(b.createdAt),
    updatedAt: reviveDate(b.updatedAt),
  }
}

/**
 * Banners del inicio. Caché corta: las ventanas startsAt/endsAt se evalúan al
 * consultar, así que un banner programado puede tardar hasta REVALIDATE_SHORT
 * en aparecer o desaparecer. Las actions de banners invalidan el tag 'banners'.
 */
export const getActiveBanners = cache(
  cachedQuery(fetchActiveBanners, ['active-banners'], {
    tags: [CACHE_TAGS.banners],
    revalidate: REVALIDATE_SHORT,
    revive: (rows) => rows.map(reviveBanner),
  }),
)

export async function getBanners(): Promise<BannerRow[]> {
  return db.banner.findMany({
    select: BANNER_SELECT,
    orderBy: [{ active: 'desc' }, { position: 'asc' }],
  })
}

export async function getBannerById(id: string): Promise<BannerRow | null> {
  return db.banner.findUnique({ where: { id }, select: BANNER_SELECT })
}
