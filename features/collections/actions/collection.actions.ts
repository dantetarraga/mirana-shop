"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { collectionRepo } from "@/modules/catalog/repositories/collection.repo";

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

const createCollectionSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(100),
  slug: slugSchema,
  description: z.string().max(1000).optional(),
  imageUrl: z.string().url("URL de imagen inválida").optional().or(z.literal("")),
  active: z.boolean().default(true),
});

const updateCollectionSchema = createCollectionSchema.partial().extend({
  id: z.string().min(1, "ID requerido"),
});

// ---------------------------------------------------------------------------
// Cache invalidation
// ---------------------------------------------------------------------------

function invalidateCollectionCaches() {
  revalidatePath("/admin/collections");
  revalidatePath("/admin/dashboard");
  revalidatePath("/");
  revalidateTag("collections");
  revalidateTag("catalog");
}

// ---------------------------------------------------------------------------
// createCollection
// ---------------------------------------------------------------------------

export async function createCollection(
  rawInput: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsed = createCollectionSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { name, slug, description, imageUrl, active } = parsed.data;

  try {
    const existing = await collectionRepo.findBySlug(slug);
    if (existing) {
      return { success: false, error: "Ya existe una colección con ese slug" };
    }

    const collection = await collectionRepo.create({
      name,
      slug,
      description: description || undefined,
      imageUrl: imageUrl || undefined,
      active,
    });

    invalidateCollectionCaches();
    return { success: true, data: { id: collection.id } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear colección";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// updateCollection
// ---------------------------------------------------------------------------

export async function updateCollection(
  rawInput: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsed = updateCollectionSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { id, ...fields } = parsed.data;

  try {
    if (fields.slug) {
      const existing = await collectionRepo.findBySlug(fields.slug);
      if (existing && existing.id !== id) {
        return { success: false, error: "Ya existe una colección con ese slug" };
      }
    }

    const collection = await collectionRepo.update(id, {
      ...fields,
      imageUrl: fields.imageUrl || undefined,
      description: fields.description || undefined,
    });

    invalidateCollectionCaches();
    return { success: true, data: { id: collection.id } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al actualizar colección";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// deleteCollection
// ---------------------------------------------------------------------------

export async function deleteCollection(id: string): Promise<ActionResult> {
  if (!id) return { success: false, error: "ID de colección requerido" };

  try {
    await collectionRepo.softDelete(id);
    invalidateCollectionCaches();
    return { success: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al eliminar colección";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// addProductToCollection
// ---------------------------------------------------------------------------

export async function addProductToCollection(
  collectionId: string,
  productId: string
): Promise<ActionResult> {
  if (!collectionId || !productId) {
    return { success: false, error: "IDs de colección y producto requeridos" };
  }

  try {
    await collectionRepo.addProduct(collectionId, productId);
    invalidateCollectionCaches();
    revalidatePath(`/admin/collections`);
    return { success: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al agregar producto a colección";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// removeProductFromCollection
// ---------------------------------------------------------------------------

export async function removeProductFromCollection(
  collectionId: string,
  productId: string
): Promise<ActionResult> {
  if (!collectionId || !productId) {
    return { success: false, error: "IDs de colección y producto requeridos" };
  }

  try {
    await collectionRepo.removeProduct(collectionId, productId);
    invalidateCollectionCaches();
    return { success: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al quitar producto de colección";
    return { success: false, error: message };
  }
}
