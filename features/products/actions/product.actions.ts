"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { productRepo } from "@/modules/catalog/repositories/product.repo";
import { categoryRepo } from "@/modules/catalog/repositories/category.repo";
import { brandRepo } from "@/modules/catalog/repositories/brand.repo";
import { productDbSchema, importProductRowSchema } from "@/shared/lib/schemas";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Tipos de resultado
// ---------------------------------------------------------------------------

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function invalidateProductCaches() {
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/dashboard");
  revalidatePath("/catalogo");
  revalidatePath("/");
  revalidateTag("products", "layout");
  revalidateTag("catalog", "layout");
}

// ---------------------------------------------------------------------------
// createProduct
// ---------------------------------------------------------------------------

export async function createProduct(
  rawInput: unknown
): Promise<ActionResult<{ id: string; slug: string }>> {
  const parsed = productDbSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos";
    return { success: false, error: firstError };
  }

  const input = parsed.data;

  try {
    const product = await productRepo.create({
      sku: input.sku,
      slug: input.slug || slugify(input.name),
      name: input.name,
      description: input.description ?? "",
      price: input.price,
      compareAtPrice: input.compareAtPrice,
      status: input.status,
      featured: input.featured,
      categoryId: input.categoryId,
      brandId: input.brandId,
      stock: input.stock,
      images: input.imageUrl
        ? [{ url: input.imageUrl, alt: input.name, position: 0 }]
        : [],
    });

    invalidateProductCaches();
    return { success: true, data: { id: product.id, slug: product.slug } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear producto";
    // SKU duplicado es el caso más común
    if (message.includes("Unique constraint") || message.includes("unique")) {
      return { success: false, error: "El SKU o slug ya existe" };
    }
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// updateProduct
// ---------------------------------------------------------------------------

export async function updateProduct(
  id: string,
  rawInput: unknown
): Promise<ActionResult<{ id: string }>> {
  if (!id) return { success: false, error: "ID de producto requerido" };

  const parsed = productDbSchema.partial().safeParse(rawInput);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos";
    return { success: false, error: firstError };
  }

  const input = parsed.data;

  try {
    const updated = await productRepo.update({
      id,
      ...(input.sku !== undefined && { sku: input.sku }),
      ...(input.name !== undefined && { name: input.name }),
      ...(input.slug !== undefined && { slug: input.slug }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.price !== undefined && { price: input.price }),
      ...(input.compareAtPrice !== undefined && { compareAtPrice: input.compareAtPrice }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.featured !== undefined && { featured: input.featured }),
      ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
      ...(input.brandId !== undefined && { brandId: input.brandId }),
      ...(input.stock !== undefined && { stock: input.stock }),
    });

    invalidateProductCaches();
    return { success: true, data: { id: updated.id } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al actualizar producto";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// deleteProduct
// ---------------------------------------------------------------------------

export async function deleteProduct(id: string): Promise<ActionResult> {
  if (!id) return { success: false, error: "ID de producto requerido" };

  try {
    await productRepo.delete(id);
    invalidateProductCaches();
    return { success: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al eliminar producto";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// importProducts
// Recibe filas del Excel ya parseadas por el cliente, las valida y las inserta.
// Estrategia: upsert por SKU (update si existe, create si no).
// ---------------------------------------------------------------------------

const importRowSchema = z.array(importProductRowSchema);

type ImportRow = z.infer<typeof importProductRowSchema>;

export async function importProducts(
  rawRows: unknown
): Promise<ActionResult<{ created: number; updated: number; errors: string[] }>> {
  const parsed = importRowSchema.safeParse(rawRows);
  if (!parsed.success) {
    return { success: false, error: "Formato de importación inválido" };
  }

  const rows = parsed.data;
  const errors: string[] = [];
  let created = 0;
  let updated = 0;

  // Mapas para resolver categoryId y brandId por nombre/slug
  const [categories, brands] = await Promise.all([
    categoryRepo.findAll(),
    brandRepo.findAll(),
  ]);

  const catMap: Record<string, string> = {
    figures: categories.find((c) => c.slug === "figuras-accion")?.id ?? "",
    lego: categories.find((c) => c.slug === "lego")?.id ?? "",
    vehicles: categories.find((c) => c.slug === "modelos-escala")?.id ?? "",
  };

  for (const row of rows) {
    try {
      const categoryId = catMap[row.cat];
      if (!categoryId) {
        errors.push(`Fila "${row.name}": categoría "${row.cat}" no encontrada`);
        continue;
      }

      // Resolución de marca: busca por nombre case-insensitive
      const brandName = (row.brand ?? "").toLowerCase();
      const brand = brands.find((b) => b.name.toLowerCase() === brandName);
      const brandId = brand?.id ?? brands[0]?.id;

      if (!brandId) {
        errors.push(`Fila "${row.name}": no se encontró marca`);
        continue;
      }

      const slug = slugify(row.name) + "-" + row.sku.toLowerCase();
      const existing = await productRepo.findMany({ search: row.sku, take: 1 });
      const match = existing.find((p) => p.sku === row.sku);

      if (match) {
        await productRepo.update({
          id: match.id,
          name: row.name,
          price: row.price,
          description: row.desc ?? "",
          stock: row.stock,
        });
        updated++;
      } else {
        await productRepo.create({
          sku: row.sku,
          slug,
          name: row.name,
          description: row.desc ?? "",
          price: row.price,
          categoryId,
          brandId,
          stock: row.stock,
          status: "AVAILABLE",
          featured: false,
        });
        created++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      errors.push(`Fila "${(row as ImportRow).name}": ${msg}`);
    }
  }

  invalidateProductCaches();
  return { success: true, data: { created, updated, errors } };
}
