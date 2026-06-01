import { db } from "@/shared/lib/db";

export type BrandRow = {
  id:           string;
  name:         string;
  slug:         string;
  tagline:      string | null;
  description:  string | null;
  imageUrl:     string | null;
  productCount: number;
};

export type CreateBrandInput = {
  name:         string;
  slug:         string;
  tagline?:     string;
  description?: string;
  imageUrl?:    string;
};

export type UpdateBrandInput = Partial<CreateBrandInput>;

export interface BrandFilters {
  search?:  string;
  page?:    number;
  perPage?: number;
}

// ---------------------------------------------------------------------------
// Select reutilizable
// ---------------------------------------------------------------------------

const BRAND_SELECT = {
  id:          true,
  name:        true,
  slug:        true,
  tagline:     true,
  description: true,
  imageUrl:    true,
  _count: { select: { products: { where: { deletedAt: null } } } },
} as const;

function mapRow(b: {
  id: string; name: string; slug: string;
  tagline: string | null; description: string | null; imageUrl: string | null;
  _count: { products: number };
}): BrandRow {
  return {
    id:           b.id,
    name:         b.name,
    slug:         b.slug,
    tagline:      b.tagline,
    description:  b.description,
    imageUrl:     b.imageUrl,
    productCount: b._count.products,
  };
}

// ---------------------------------------------------------------------------
// BrandRepo
// ---------------------------------------------------------------------------

export const brandRepo = {
  async findAll(filters: BrandFilters = {}): Promise<BrandRow[]> {
    const { search, page = 1, perPage = 50 } = filters;
    const skip = (page - 1) * perPage;

    const brands = await db.brand.findMany({
      where: {
        deletedAt: null,
        ...(search ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
          ],
        } : {}),
      },
      select: BRAND_SELECT,
      orderBy: { name: "asc" },
      skip,
      take: perPage,
    });

    return brands.map(mapRow);
  },

  async count(filters: Pick<BrandFilters, "search"> = {}): Promise<number> {
    const { search } = filters;
    return db.brand.count({
      where: {
        deletedAt: null,
        ...(search ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
          ],
        } : {}),
      },
    });
  },

  findBySlug(slug: string): Promise<BrandRow | null> {
    return db.brand
      .findFirst({ where: { slug, deletedAt: null }, select: BRAND_SELECT })
      .then((b) => b ? mapRow(b) : null);
  },

  findById(id: string): Promise<BrandRow | null> {
    return db.brand
      .findFirst({ where: { id, deletedAt: null }, select: BRAND_SELECT })
      .then((b) => b ? mapRow(b) : null);
  },

  async create(input: CreateBrandInput): Promise<BrandRow> {
    const brand = await db.brand.create({
      data: {
        name:        input.name,
        slug:        input.slug,
        tagline:     input.tagline     ?? null,
        description: input.description ?? null,
        imageUrl:    input.imageUrl    ?? null,
      },
      select: BRAND_SELECT,
    });
    return mapRow(brand);
  },

  async update(id: string, input: UpdateBrandInput): Promise<BrandRow> {
    const brand = await db.brand.update({
      where: { id },
      data: {
        ...(input.name        !== undefined && { name:        input.name }),
        ...(input.slug        !== undefined && { slug:        input.slug }),
        ...(input.tagline     !== undefined && { tagline:     input.tagline }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.imageUrl    !== undefined && { imageUrl:    input.imageUrl }),
      },
      select: BRAND_SELECT,
    });
    return mapRow(brand);
  },

  async softDelete(id: string): Promise<void> {
    await db.brand.update({ where: { id }, data: { deletedAt: new Date() } });
  },
};
