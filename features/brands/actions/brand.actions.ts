"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { brandRepo } from "@/modules/catalog/repositories/brand.repo";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Schemas Zod
// ---------------------------------------------------------------------------

const slugSchema = z
  .string()
  .min(1, "Slug requerido")
  .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones");

const createBrandSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(100),
  slug: slugSchema,
  description: z.string().max(500).optional(),
  imageUrl: z.string().url("URL de imagen inválida").optional().or(z.literal("")),
  logoUrl: z.string().url("URL de logo inválida").optional().or(z.literal("")),
});

const updateBrandSchema = createBrandSchema.partial().extend({
  id: z.string().min(1, "ID requerido"),
});

// ---------------------------------------------------------------------------
// Cache invalidation
// ---------------------------------------------------------------------------

function invalidateBrandCaches() {
  revalidatePath("/admin/brands");
  revalidatePath("/admin/products");
  revalidatePath("/admin/dashboard");
  revalidateTag("brands", "layout");
  revalidateTag("catalog", "layout");
}

// ---------------------------------------------------------------------------
// createBrand
// ---------------------------------------------------------------------------

export async function createBrand(
  rawInput: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsed = createBrandSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { name, slug, description, imageUrl, logoUrl } = parsed.data;

  try {
    const existing = await brandRepo.findBySlug(slug);
    if (existing) {
      return { success: false, error: "Ya existe una marca con ese slug" };
    }

    const brand = await brandRepo.create({
      name,
      slug,
      description: description || undefined,
      imageUrl: imageUrl || undefined,
      logoUrl: logoUrl || undefined,
    });

    invalidateBrandCaches();
    return { success: true, data: { id: brand.id } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear marca";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// updateBrand
// ---------------------------------------------------------------------------

export async function updateBrand(
  rawInput: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsed = updateBrandSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { id, ...fields } = parsed.data;

  try {
    if (fields.slug) {
      const existing = await brandRepo.findBySlug(fields.slug);
      if (existing && existing.id !== id) {
        return { success: false, error: "Ya existe una marca con ese slug" };
      }
    }

    const brand = await brandRepo.update(id, {
      ...fields,
      imageUrl: fields.imageUrl || undefined,
      logoUrl: fields.logoUrl || undefined,
      description: fields.description || undefined,
    });

    invalidateBrandCaches();
    return { success: true, data: { id: brand.id } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al actualizar marca";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// deleteBrand
// ---------------------------------------------------------------------------

export async function deleteBrand(id: string): Promise<ActionResult> {
  if (!id) return { success: false, error: "ID de marca requerido" };

  try {
    const brand = await brandRepo.findById(id);
    if (!brand) return { success: false, error: "Marca no encontrada" };

    if (brand.productCount > 0) {
      return {
        success: false,
        error: `No se puede eliminar: la marca tiene ${brand.productCount} producto(s) asociado(s)`,
      };
    }

    await brandRepo.softDelete(id);
    invalidateBrandCaches();
    return { success: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al eliminar marca";
    return { success: false, error: message };
  }
}
