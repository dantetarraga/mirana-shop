"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { bannerRepo } from "@/modules/catalog/repositories/banner.repo";
import { bannerDbSchema } from "@/shared/lib/schemas";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

function invalidateBannerCaches() {
  revalidatePath("/admin/banners");
  revalidatePath("/admin/dashboard");
  revalidatePath("/");
  revalidateTag("banners", "layout");
}

// ---------------------------------------------------------------------------
// saveBanner — crea o actualiza según si id está presente
// ---------------------------------------------------------------------------

export async function saveBanner(
  id: string | null,
  rawInput: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsed = bannerDbSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos";
    return { success: false, error: firstError };
  }

  const input = parsed.data;

  try {
    if (id) {
      // Actualizar banner existente
      const updated = await bannerRepo.update({
        id,
        title: input.title,
        subtitle: input.subtitle || undefined,
        ctaLabel: input.ctaLabel || undefined,
        ctaHref: input.ctaHref || undefined,
        imageUrl: input.imageUrl,
        position: input.position,
        active: input.active,
      });
      invalidateBannerCaches();
      return { success: true, data: { id: updated.id } };
    } else {
      // Crear nuevo banner
      const created = await bannerRepo.create({
        title: input.title,
        subtitle: input.subtitle || undefined,
        ctaLabel: input.ctaLabel || undefined,
        ctaHref: input.ctaHref || undefined,
        imageUrl: input.imageUrl,
        position: input.position,
        active: input.active,
      });
      invalidateBannerCaches();
      return { success: true, data: { id: created.id } };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al guardar banner";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// toggleBanner — activa/desactiva un banner
// ---------------------------------------------------------------------------

export async function toggleBanner(
  id: string,
  currentActive: boolean
): Promise<ActionResult> {
  if (!id) return { success: false, error: "ID de banner requerido" };

  try {
    await bannerRepo.toggle(id, !currentActive);
    invalidateBannerCaches();
    return { success: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al cambiar estado del banner";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// deleteBanner
// ---------------------------------------------------------------------------

export async function deleteBanner(id: string): Promise<ActionResult> {
  if (!id) return { success: false, error: "ID de banner requerido" };

  try {
    await bannerRepo.delete(id);
    invalidateBannerCaches();
    return { success: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al eliminar banner";
    return { success: false, error: message };
  }
}
