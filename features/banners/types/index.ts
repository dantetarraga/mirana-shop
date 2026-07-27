export type BannerRow = {
  id: string
  /** Opcional: hay banners que son solo imagen */
  title: string | null
  subtitle: string | null
  /** Las tres imágenes son opcionales; ver features/banners/lib/banner-image.ts */
  imageUrl: string | null
  imageUrlMobile: string | null
  imageUrlFull: string | null
  ctaLabel: string | null
  ctaHref: string | null
  position: number
  active: boolean
  startsAt: Date | null
  endsAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type CreateBannerInput = {
  title?: string
  subtitle?: string
  imageUrl?: string
  imageUrlMobile?: string
  imageUrlFull?: string
  ctaLabel?: string
  ctaHref?: string
  position?: number
  active?: boolean
  startsAt?: Date
  endsAt?: Date
}

export type UpdateBannerInput = Partial<CreateBannerInput> & { id: string }
