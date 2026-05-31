import { db } from "@/shared/lib/db";

// ---------------------------------------------------------------------------
// CategoryRepo — queries de categorías del catálogo
// ---------------------------------------------------------------------------

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
};

export const categoryRepo = {
  findAll(): Promise<CategoryRow[]> {
    return db.category.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, slug: true, parentId: true },
      orderBy: { name: "asc" },
    });
  },

  findBySlug(slug: string): Promise<CategoryRow | null> {
    return db.category.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true, name: true, slug: true, parentId: true },
    });
  },

  findById(id: string): Promise<CategoryRow | null> {
    return db.category.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, name: true, slug: true, parentId: true },
    });
  },
};
