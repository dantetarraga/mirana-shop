import { db } from "@/shared/lib/db";

// ---------------------------------------------------------------------------
// CategoryRepo — queries de categorías del catálogo
// ---------------------------------------------------------------------------

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  description: string | null;
  imageUrl: string | null;
  productCount: number;
};

export type CreateCategoryInput = {
  name: string;
  slug: string;
  parentId?: string;
  description?: string;
  imageUrl?: string;
};

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export interface CategoryFilters {
  search?: string;
  page?: number;
  perPage?: number;
}

export const categoryRepo = {
  async findAll(filters: CategoryFilters = {}): Promise<CategoryRow[]> {
    const { search, page = 1, perPage = 50 } = filters;
    const skip = (page - 1) * perPage;

    const categories = await db.category.findMany({
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
        parentId: true,
        description: true,
        imageUrl: true,
        _count: { select: { products: { where: { deletedAt: null } } } },
      },
      orderBy: { name: "asc" },
      skip,
      take: perPage,
    });

    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parentId: c.parentId,
      description: c.description,
      imageUrl: c.imageUrl,
      productCount: c._count.products,
    }));
  },

  async count(filters: Pick<CategoryFilters, "search"> = {}): Promise<number> {
    const { search } = filters;
    return db.category.count({
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

  findBySlug(slug: string): Promise<CategoryRow | null> {
    return db.category
      .findFirst({
        where: { slug, deletedAt: null },
        select: {
          id: true,
          name: true,
          slug: true,
          parentId: true,
          description: true,
          imageUrl: true,
          _count: { select: { products: { where: { deletedAt: null } } } },
        },
      })
      .then((c) =>
        c
          ? {
              id: c.id,
              name: c.name,
              slug: c.slug,
              parentId: c.parentId,
              description: c.description,
              imageUrl: c.imageUrl,
              productCount: c._count.products,
            }
          : null
      );
  },

  findById(id: string): Promise<CategoryRow | null> {
    return db.category
      .findFirst({
        where: { id, deletedAt: null },
        select: {
          id: true,
          name: true,
          slug: true,
          parentId: true,
          description: true,
          imageUrl: true,
          _count: { select: { products: { where: { deletedAt: null } } } },
        },
      })
      .then((c) =>
        c
          ? {
              id: c.id,
              name: c.name,
              slug: c.slug,
              parentId: c.parentId,
              description: c.description,
              imageUrl: c.imageUrl,
              productCount: c._count.products,
            }
          : null
      );
  },

  async create(input: CreateCategoryInput): Promise<CategoryRow> {
    const category = await db.category.create({
      data: {
        name: input.name,
        slug: input.slug,
        parentId: input.parentId ?? null,
        description: input.description ?? null,
        imageUrl: input.imageUrl ?? null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        description: true,
        imageUrl: true,
        _count: { select: { products: { where: { deletedAt: null } } } },
      },
    });
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      parentId: category.parentId,
      description: category.description,
      imageUrl: category.imageUrl,
      productCount: category._count.products,
    };
  },

  async update(id: string, input: UpdateCategoryInput): Promise<CategoryRow> {
    const category = await db.category.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.slug !== undefined && { slug: input.slug }),
        ...(input.parentId !== undefined && { parentId: input.parentId }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        description: true,
        imageUrl: true,
        _count: { select: { products: { where: { deletedAt: null } } } },
      },
    });
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      parentId: category.parentId,
      description: category.description,
      imageUrl: category.imageUrl,
      productCount: category._count.products,
    };
  },

  async softDelete(id: string): Promise<void> {
    await db.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
