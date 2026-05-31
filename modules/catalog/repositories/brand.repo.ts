import { db } from "@/shared/lib/db";

// ---------------------------------------------------------------------------
// BrandRepo — queries de marcas del catálogo
// ---------------------------------------------------------------------------

export type BrandRow = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
};

export const brandRepo = {
  findAll(): Promise<BrandRow[]> {
    return db.brand.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, slug: true, logoUrl: true },
      orderBy: { name: "asc" },
    });
  },

  findBySlug(slug: string): Promise<BrandRow | null> {
    return db.brand.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true, name: true, slug: true, logoUrl: true },
    });
  },

  findById(id: string): Promise<BrandRow | null> {
    return db.brand.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, name: true, slug: true, logoUrl: true },
    });
  },
};
