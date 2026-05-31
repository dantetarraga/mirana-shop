import { db } from "@/shared/lib/db";

// ---------------------------------------------------------------------------
// CollectionRepo — queries de colecciones del catálogo
// ---------------------------------------------------------------------------

export type CollectionRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  active: boolean;
  productCount: number;
  createdAt: Date;
};

export type CollectionWithProducts = CollectionRow & {
  products: Array<{
    productId: string;
    name: string;
    sku: string;
  }>;
};

export type CreateCollectionInput = {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  active?: boolean;
};

export type UpdateCollectionInput = Partial<CreateCollectionInput>;

export interface CollectionFilters {
  search?: string;
  active?: boolean;
  page?: number;
  perPage?: number;
}

const COLLECTION_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  imageUrl: true,
  active: true,
  createdAt: true,
  _count: {
    select: {
      products: {
        where: {
          product: { deletedAt: null },
        },
      },
    },
  },
} as const;

function mapRow(c: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  active: boolean;
  createdAt: Date;
  _count: { products: number };
}): CollectionRow {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    imageUrl: c.imageUrl,
    active: c.active,
    createdAt: c.createdAt,
    productCount: c._count.products,
  };
}

export const collectionRepo = {
  async findAll(filters: CollectionFilters = {}): Promise<CollectionRow[]> {
    const { search, active, page = 1, perPage = 50 } = filters;
    const skip = (page - 1) * perPage;

    const rows = await db.collection.findMany({
      where: {
        deletedAt: null,
        ...(active !== undefined && { active }),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { slug: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: COLLECTION_SELECT,
      orderBy: { name: "asc" },
      skip,
      take: perPage,
    });

    return rows.map(mapRow);
  },

  async count(
    filters: Pick<CollectionFilters, "search" | "active"> = {}
  ): Promise<number> {
    const { search, active } = filters;
    return db.collection.count({
      where: {
        deletedAt: null,
        ...(active !== undefined && { active }),
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

  async findBySlug(slug: string): Promise<CollectionWithProducts | null> {
    const c = await db.collection.findFirst({
      where: { slug, deletedAt: null },
      select: {
        ...COLLECTION_SELECT,
        products: {
          where: { product: { deletedAt: null } },
          select: {
            productId: true,
            product: { select: { name: true, sku: true } },
          },
        },
      },
    });
    if (!c) return null;
    return {
      ...mapRow(c),
      products: c.products.map((p) => ({
        productId: p.productId,
        name: p.product.name,
        sku: p.product.sku,
      })),
    };
  },

  async findById(id: string): Promise<CollectionWithProducts | null> {
    const c = await db.collection.findFirst({
      where: { id, deletedAt: null },
      select: {
        ...COLLECTION_SELECT,
        products: {
          where: { product: { deletedAt: null } },
          select: {
            productId: true,
            product: { select: { name: true, sku: true } },
          },
        },
      },
    });
    if (!c) return null;
    return {
      ...mapRow(c),
      products: c.products.map((p) => ({
        productId: p.productId,
        name: p.product.name,
        sku: p.product.sku,
      })),
    };
  },

  async create(input: CreateCollectionInput): Promise<CollectionRow> {
    const c = await db.collection.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        imageUrl: input.imageUrl ?? null,
        active: input.active ?? true,
      },
      select: COLLECTION_SELECT,
    });
    return mapRow(c);
  },

  async update(id: string, input: UpdateCollectionInput): Promise<CollectionRow> {
    const c = await db.collection.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.slug !== undefined && { slug: input.slug }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
        ...(input.active !== undefined && { active: input.active }),
      },
      select: COLLECTION_SELECT,
    });
    return mapRow(c);
  },

  async softDelete(id: string): Promise<void> {
    await db.collection.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  async addProduct(collectionId: string, productId: string): Promise<void> {
    await db.productCollection.upsert({
      where: { productId_collectionId: { productId, collectionId } },
      create: { productId, collectionId },
      update: {},
    });
  },

  async removeProduct(collectionId: string, productId: string): Promise<void> {
    await db.productCollection.deleteMany({
      where: { collectionId, productId },
    });
  },
};
