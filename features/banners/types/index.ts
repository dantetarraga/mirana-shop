export type BannerRow = {
  id: string
  title: string
  subtitle: string | null
  imageUrl: string
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
  title: string
  subtitle?: string
  imageUrl: string
  ctaLabel?: string
  ctaHref?: string
  position?: number
  active?: boolean
  startsAt?: Date
  endsAt?: Date
}

export type UpdateBannerInput = Partial<CreateBannerInput> & { id: string }
