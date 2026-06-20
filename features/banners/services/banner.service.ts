import { db } from "@/shared/lib/db";

// ---------------------------------------------------------------------------
// BannerRepo
// ---------------------------------------------------------------------------

export type BannerRow = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  ctaLabel: string | null;
  ctaHref: string | null;
  position: number;
  active: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateBannerInput = {
  title: string;
  subtitle?: string;
  imageUrl: string;
  ctaLabel?: string;
  ctaHref?: string;
  position?: number;
  active?: boolean;
  startsAt?: Date;
  endsAt?: Date;
};

export type UpdateBannerInput = Partial<CreateBannerInput> & { id: string };

const bannerSelect = {
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
} as const;

export const bannerRepo = {
  findActive(): Promise<BannerRow[]> {
    const now = new Date();
    return db.banner.findMany({
      where: {
        active: true,
        OR: [
          { startsAt: null },
          { startsAt: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endsAt: null },
              { endsAt: { gte: now } },
            ],
          },
        ],
      },
      select: bannerSelect,
      orderBy: { position: "asc" },
    });
  },

  findAll(): Promise<BannerRow[]> {
    return db.banner.findMany({
      select: bannerSelect,
      orderBy: [{ active: "desc" }, { position: "asc" }],
    });
  },

  findById(id: string): Promise<BannerRow | null> {
    return db.banner.findUnique({
      where: { id },
      select: bannerSelect,
    });
  },

  create(input: CreateBannerInput): Promise<BannerRow> {
    return db.banner.create({
      data: {
        title: input.title,
        subtitle: input.subtitle ?? null,
        imageUrl: input.imageUrl,
        ctaLabel: input.ctaLabel ?? null,
        ctaHref: input.ctaHref ?? null,
        position: input.position ?? 0,
        active: input.active ?? false,
        startsAt: input.startsAt ?? null,
        endsAt: input.endsAt ?? null,
      },
      select: bannerSelect,
    });
  },

  update(input: UpdateBannerInput): Promise<BannerRow> {
    const { id, ...data } = input;
    return db.banner.update({
      where: { id },
      data: {
        title: data.title,
        subtitle: data.subtitle ?? undefined,
        imageUrl: data.imageUrl,
        ctaLabel: data.ctaLabel ?? undefined,
        ctaHref: data.ctaHref ?? undefined,
        position: data.position,
        active: data.active,
        startsAt: data.startsAt ?? undefined,
        endsAt: data.endsAt ?? undefined,
      },
      select: bannerSelect,
    });
  },

  toggle(id: string, active: boolean): Promise<BannerRow> {
    return db.banner.update({
      where: { id },
      data: { active },
      select: bannerSelect,
    });
  },

  delete(id: string): Promise<void> {
    return db.banner.delete({ where: { id } }).then(() => undefined);
  },
};
