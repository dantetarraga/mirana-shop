import { db } from "@/shared/lib/db";

// ---------------------------------------------------------------------------
// BrandRepo — queries de marcas del catálogo
// ---------------------------------------------------------------------------

export type BrandRow = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  imageUrl: string | null;
  productCount: number;
};

export type BrandDetail = BrandRow;

export type CreateBrandInput = {
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  imageUrl?: string;
};

export type UpdateBrandInput = Partial<CreateBrandInput>;

export interface BrandFilters {
  search?: string;
  page?: number;
  perPage?: number;
}

export const brandRepo = {
  async findAll(filters: BrandFilters = {}): Promise<BrandRow[]> {
    const { search, page = 1, perPage = 50 } = filters;
    const skip = (page - 1) * perPage;

    const brands = await db.brand.findMany({
      where: {
        deletedAt: null,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { slug: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        description: true,
        imageUrl: true,
        _count: { select: { products: { where: { deletedAt: null } } } },
      },
      orderBy: { name: "asc" },
      skip,
      take: perPage,
    });

    return brands.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      logoUrl: b.logoUrl,
      description: b.description,
      imageUrl: b.imageUrl,
      productCount: b._count.products,
    }));
  },

  async count(filters: Pick<BrandFilters, "search"> = {}): Promise<number> {
    const { search } = filters;
    return db.brand.count({
      where: {
        deletedAt: null,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { slug: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
    });
  },

  findBySlug(slug: string): Promise<BrandRow | null> {
    return db.brand
      .findFirst({
        where: { slug, deletedAt: null },
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          description: true,
          imageUrl: true,
          _count: { select: { products: { where: { deletedAt: null } } } },
        },
      })
      .then((b) =>
        b
          ? {
              id: b.id,
              name: b.name,
              slug: b.slug,
              logoUrl: b.logoUrl,
              description: b.description,
              imageUrl: b.imageUrl,
              productCount: b._count.products,
            }
          : null
      );
  },

  findById(id: string): Promise<BrandRow | null> {
    return db.brand
      .findFirst({
        where: { id, deletedAt: null },
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          description: true,
          imageUrl: true,
          _count: { select: { products: { where: { deletedAt: null } } } },
        },
      })
      .then((b) =>
        b
          ? {
              id: b.id,
              name: b.name,
              slug: b.slug,
              logoUrl: b.logoUrl,
              description: b.description,
              imageUrl: b.imageUrl,
              productCount: b._count.products,
            }
          : null
      );
  },

  async create(input: CreateBrandInput): Promise<BrandRow> {
    const brand = await db.brand.create({
      data: {
        name: input.name,
        slug: input.slug,
        logoUrl: input.logoUrl ?? null,
        description: input.description ?? null,
        imageUrl: input.imageUrl ?? null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        description: true,
        imageUrl: true,
        _count: { select: { products: { where: { deletedAt: null } } } },
      },
    });
    return {
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      logoUrl: brand.logoUrl,
      description: brand.description,
      imageUrl: brand.imageUrl,
      productCount: brand._count.products,
    };
  },

  async update(id: string, input: UpdateBrandInput): Promise<BrandRow> {
    const brand = await db.brand.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.slug !== undefined && { slug: input.slug }),
        ...(input.logoUrl !== undefined && { logoUrl: input.logoUrl }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        description: true,
        imageUrl: true,
        _count: { select: { products: { where: { deletedAt: null } } } },
      },
    });
    return {
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      logoUrl: brand.logoUrl,
      description: brand.description,
      imageUrl: brand.imageUrl,
      productCount: brand._count.products,
    };
  },

  async softDelete(id: string): Promise<void> {
    await db.brand.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
