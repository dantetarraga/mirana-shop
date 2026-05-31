import { db } from "@/shared/lib/db";
import type { ProductStatus } from "../generated/prisma/client";
import type { Decimal } from "../../../generated/prisma/runtime/library";

// ---------------------------------------------------------------------------
// Tipos de retorno — nunca devolvemos el modelo Prisma crudo,
// así aislamos el dominio de la infraestructura.
// ---------------------------------------------------------------------------

export type ProductImage = {
  id: string;
  url: string;
  alt: string | null;
  position: number;
};

export type ProductListItem = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  price: Decimal;
  compareAtPrice: Decimal | null;
  status: ProductStatus;
  featured: boolean;
  category: { id: string; name: string; slug: string };
  brand: { id: string; name: string; slug: string };
  images: ProductImage[];
  inventory: { availableStock: number } | null;
};

export type ProductDetail = ProductListItem & {
  description: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductFilters = {
  categorySlug?: string;
  brandSlug?: string;
  search?: string;
  featured?: boolean;
  status?: ProductStatus;
  take?: number;
  skip?: number;
};

export type CreateProductInput = {
  sku: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  status?: ProductStatus;
  featured?: boolean;
  categoryId: string;
  brandId: string;
  stock?: number;
  images?: { url: string; alt?: string; position?: number }[];
};

export type UpdateProductInput = Partial<CreateProductInput> & { id: string };

// ---------------------------------------------------------------------------
// Selects reutilizables
// ---------------------------------------------------------------------------

const listSelect = {
  id: true,
  sku: true,
  slug: true,
  name: true,
  price: true,
  compareAtPrice: true,
  status: true,
  featured: true,
  category: { select: { id: true, name: true, slug: true } },
  brand: { select: { id: true, name: true, slug: true } },
  images: {
    select: { id: true, url: true, alt: true, position: true },
    orderBy: { position: "asc" as const },
    take: 1,
  },
  inventory: { select: { availableStock: true } },
} as const;

const detailSelect = {
  ...listSelect,
  description: true,
  currency: true,
  createdAt: true,
  updatedAt: true,
  images: {
    select: { id: true, url: true, alt: true, position: true },
    orderBy: { position: "asc" as const },
  },
} as const;

// ---------------------------------------------------------------------------
// ProductRepo
// ---------------------------------------------------------------------------

export const productRepo = {
  async findMany(filters: ProductFilters = {}): Promise<ProductListItem[]> {
    const {
      categorySlug,
      brandSlug,
      search,
      featured,
      status = "AVAILABLE",
      take = 50,
      skip = 0,
    } = filters;

    return db.product.findMany({
      where: {
        deletedAt: null,
        status: status ?? undefined,
        featured: featured ?? undefined,
        category: categorySlug ? { slug: categorySlug } : undefined,
        brand: brandSlug ? { slug: brandSlug } : undefined,
        name: search ? { contains: search, mode: "insensitive" } : undefined,
      },
      select: listSelect,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take,
      skip,
    }) as Promise<ProductListItem[]>;
  },

  async findFeatured(take = 8): Promise<ProductListItem[]> {
    return db.product.findMany({
      where: { deletedAt: null, featured: true, status: "AVAILABLE" },
      select: listSelect,
      orderBy: { createdAt: "desc" },
      take,
    }) as Promise<ProductListItem[]>;
  },

  async findNew(take = 6): Promise<ProductListItem[]> {
    return db.product.findMany({
      where: { deletedAt: null, status: "AVAILABLE" },
      select: listSelect,
      orderBy: { createdAt: "desc" },
      take,
    }) as Promise<ProductListItem[]>;
  },

  async findBySlug(slug: string): Promise<ProductDetail | null> {
    return db.product.findFirst({
      where: { slug, deletedAt: null },
      select: detailSelect,
    }) as Promise<ProductDetail | null>;
  },

  async findById(id: string): Promise<ProductDetail | null> {
    return db.product.findFirst({
      where: { id, deletedAt: null },
      select: detailSelect,
    }) as Promise<ProductDetail | null>;
  },

  async count(filters: Omit<ProductFilters, "take" | "skip"> = {}): Promise<number> {
    const { categorySlug, brandSlug, search, featured, status = "AVAILABLE" } = filters;
    return db.product.count({
      where: {
        deletedAt: null,
        status: status ?? undefined,
        featured: featured ?? undefined,
        category: categorySlug ? { slug: categorySlug } : undefined,
        brand: brandSlug ? { slug: brandSlug } : undefined,
        name: search ? { contains: search, mode: "insensitive" } : undefined,
      },
    });
  },

  async create(input: CreateProductInput): Promise<ProductDetail> {
    const { images, stock = 0, ...productData } = input;

    return db.product.create({
      data: {
        ...productData,
        price: productData.price,
        compareAtPrice: productData.compareAtPrice ?? null,
        status: productData.status ?? "AVAILABLE",
        images: images
          ? {
              create: images.map((img, i) => ({
                url: img.url,
                alt: img.alt ?? null,
                position: img.position ?? i,
              })),
            }
          : undefined,
        inventory: {
          create: { availableStock: stock },
        },
      },
      select: detailSelect,
    }) as Promise<ProductDetail>;
  },

  async update(input: UpdateProductInput): Promise<ProductDetail> {
    const { id, images, stock, ...rest } = input;

    return db.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: {
          ...rest,
          price: rest.price ?? undefined,
          compareAtPrice: rest.compareAtPrice ?? undefined,
        },
        select: detailSelect,
      });

      if (stock !== undefined) {
        await tx.productInventory.upsert({
          where: { productId: id },
          update: { availableStock: stock },
          create: { productId: id, availableStock: stock },
        });
      }

      return updated;
    }) as Promise<ProductDetail>;
  },

  async delete(id: string): Promise<void> {
    // Soft delete
    await db.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  async hardDelete(id: string): Promise<void> {
    await db.product.delete({ where: { id } });
  },
};
